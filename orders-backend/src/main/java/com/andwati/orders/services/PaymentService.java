package com.andwati.orders.services;

import com.andwati.orders.config.PaystackProperties;
import com.andwati.orders.dto.request.CheckoutQuoteRequest;
import com.andwati.orders.dto.request.CreateOrderRequest;
import com.andwati.orders.dto.request.PaystackInitializeRequest;
import com.andwati.orders.dto.response.CheckoutQuoteResponse;
import com.andwati.orders.dto.response.FareCalculationResponse;
import com.andwati.orders.dto.response.PaystackInitializeResponse;
import com.andwati.orders.dto.response.PaystackVerifyResponse;
import com.andwati.orders.exception.InsufficientStockException;
import com.andwati.orders.exception.InventoryNotFoundException;
import com.andwati.orders.exception.ProductNotFoundException;
import com.andwati.orders.model.*;
import com.andwati.orders.repository.InventoryItemRepository;
import com.andwati.orders.repository.PaymentRepository;
import com.andwati.orders.repository.ProductRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final String DEFAULT_CURRENCY = "KES";
    private static final int QUOTE_TTL_MINUTES = 15;

    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final PaymentRepository paymentRepository;
    private final FareCalculationService fareCalculationService;
    private final OrderService orderService;
    private final AppUserService appUserService;
    private final PaystackClient paystackClient;
    private final PaystackProperties paystackProperties;
    private final ObjectMapper objectMapper;

    public PaymentService(
            ProductRepository productRepository,
            InventoryItemRepository inventoryItemRepository,
            PaymentRepository paymentRepository,
            FareCalculationService fareCalculationService,
            OrderService orderService,
            AppUserService appUserService,
            PaystackClient paystackClient,
            PaystackProperties paystackProperties,
            ObjectMapper objectMapper
    ) {
        this.productRepository = productRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.paymentRepository = paymentRepository;
        this.fareCalculationService = fareCalculationService;
        this.orderService = orderService;
        this.appUserService = appUserService;
        this.paystackClient = paystackClient;
        this.paystackProperties = paystackProperties;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public CheckoutQuoteResponse quote(CheckoutQuoteRequest request) {
        CheckoutQuote quote = calculateQuote(request.items(), request.deliveryRide());
        return toQuoteResponse(quote);
    }

    @Transactional
    public PaystackInitializeResponse initialize(PaystackInitializeRequest request) {
        AppUser customer = appUserService.getCurrentUser();
        if (customer.getRole() != Role.CUSTOMER) {
            throw new IllegalArgumentException("Only customers can checkout");
        }

        CheckoutQuote quote = calculateQuote(request.items(), request.deliveryRide());
        PendingOrderResult pendingOrder = orderService.createPendingOrder(
                customer,
                request.toCreateOrderRequest(),
                quote.rideFare(),
                quote.currency()
        );

        String reference = generateReference();
        Payment payment = new Payment()
                .setOrder(pendingOrder.order())
                .setRide(pendingOrder.ride())
                .setReference(reference)
                .setProductSubtotal(quote.productSubtotal())
                .setRideFare(quote.rideFare())
                .setAmountMajor(quote.grandTotal())
                .setAmountSubunits(toSubunits(quote.grandTotal()))
                .setCurrency(quote.currency())
                .setStatus(PaymentStatus.PENDING);

        paymentRepository.save(payment);

        JsonNode paystackData = paystackClient.initializeTransaction(
                customer.getUsername(),
                payment.getAmountSubunits(),
                payment.getCurrency(),
                payment.getReference(),
                buildMetadata(customer, payment)
        );

        payment
                .setAuthorizationUrl(paystackData.path("authorization_url").asText())
                .setAccessCode(paystackData.path("access_code").asText());

        return toInitializeResponse(payment);
    }

    @Transactional
    public PaystackVerifyResponse verify(String reference) {
        Payment payment = getPayment(reference);
        assertCanAccess(payment);

        return verifyPayment(payment);
    }

    @Transactional
    public void handleWebhook(String body, String signature) {
        verifyWebhookSignature(body, signature);

        JsonNode event;
        try {
            event = objectMapper.readTree(body);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Webhook payload is not valid JSON");
        }

        if (!"charge.success".equals(event.path("event").asText())) {
            return;
        }

        String reference = event.path("data").path("reference").asText(null);
        if (reference == null || reference.isBlank()) {
            return;
        }

        paymentRepository.findByReference(reference).ifPresent(this::verifyPayment);
    }

    private PaystackVerifyResponse verifyPayment(Payment payment) {
        JsonNode verification = paystackClient.verifyTransaction(payment.getReference());
        JsonNode data = verification.path("data");
        String rawPayload = toJson(verification);

        boolean success = "success".equals(data.path("status").asText());
        boolean matchesReference = payment.getReference().equals(data.path("reference").asText());
        boolean matchesAmount = payment.getAmountSubunits() == data.path("amount").asLong();
        boolean matchesCurrency = payment.getCurrency().equalsIgnoreCase(data.path("currency").asText());

        if (success && matchesReference && matchesAmount && matchesCurrency) {
            payment.markPaid(rawPayload);
            return toVerifyResponse(payment, "Payment verified");
        }

        PaymentStatus nextStatus = mapPaystackStatus(data.path("status").asText());
        payment.markFailed(nextStatus, rawPayload);

        if (!success) {
            return toVerifyResponse(payment, data.path("gateway_response").asText("Payment was not successful"));
        }

        throw new IllegalArgumentException("Paystack verification did not match the stored payment");
    }

    private CheckoutQuote calculateQuote(
            java.util.List<com.andwati.orders.dto.request.CreateOrderItemRequest> items,
            com.andwati.orders.dto.request.CreateOrderRideRequest deliveryRide
    ) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("items must contain at least one item");
        }

        Map<UUID, Integer> requestedQuantities = items.stream()
                .collect(Collectors.toMap(
                        com.andwati.orders.dto.request.CreateOrderItemRequest::productId,
                        com.andwati.orders.dto.request.CreateOrderItemRequest::quantity,
                        Integer::sum,
                        LinkedHashMap::new
                ));

        Map<UUID, Product> productsById = productRepository.findByIdIn(requestedQuantities.keySet())
                .stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        for (UUID productId : requestedQuantities.keySet()) {
            Product product = productsById.get(productId);
            if (product == null) {
                throw new ProductNotFoundException(productId);
            }
            if (!product.isActive()) {
                throw new IllegalArgumentException("Product " + product.getName() + " is not active");
            }
        }

        Map<UUID, InventoryItem> inventoryByProductId = inventoryItemRepository
                .findByProduct_IdIn(requestedQuantities.keySet())
                .stream()
                .collect(Collectors.toMap(
                        inventory -> inventory.getProduct().getId(),
                        Function.identity()
                ));

        BigDecimal productSubtotal = BigDecimal.ZERO;
        String currency = null;

        for (Map.Entry<UUID, Integer> entry : requestedQuantities.entrySet()) {
            UUID productId = entry.getKey();
            int quantity = entry.getValue();
            if (quantity < 1) {
                throw new IllegalArgumentException("quantity must be at least 1");
            }

            Product product = productsById.get(productId);
            InventoryItem inventory = inventoryByProductId.get(productId);
            if (inventory == null) {
                throw new InventoryNotFoundException(productId);
            }
            if (!inventory.hasEnoughStock(quantity)) {
                throw new InsufficientStockException(
                        productId,
                        product.getName(),
                        quantity,
                        inventory.getAvailableQuantity()
                );
            }

            if (currency == null) {
                currency = product.getCurrency();
            } else if (!currency.equals(product.getCurrency())) {
                throw new IllegalArgumentException("Cart items must use one currency");
            }

            productSubtotal = productSubtotal.add(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
        }

        BigDecimal rideFare = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (deliveryRide != null) {
            FareCalculationResponse fare = fareCalculationService.calculateFare(deliveryRide.distanceKm(), null);
            if (currency != null && !currency.equals(fare.currency())) {
                throw new IllegalArgumentException("Ride fare currency must match cart currency");
            }
            currency = fare.currency();
            rideFare = fare.calculatedFare();
        }

        String resolvedCurrency = currency == null ? DEFAULT_CURRENCY : currency;
        BigDecimal normalizedSubtotal = productSubtotal.setScale(2, RoundingMode.HALF_UP);
        BigDecimal normalizedRideFare = rideFare.setScale(2, RoundingMode.HALF_UP);

        return new CheckoutQuote(
                normalizedSubtotal,
                normalizedRideFare,
                normalizedSubtotal.add(normalizedRideFare).setScale(2, RoundingMode.HALF_UP),
                resolvedCurrency
        );
    }

    private CheckoutQuoteResponse toQuoteResponse(CheckoutQuote quote) {
        return new CheckoutQuoteResponse(
                quote.productSubtotal(),
                quote.rideFare(),
                quote.grandTotal(),
                quote.currency(),
                Instant.now().plusSeconds(QUOTE_TTL_MINUTES * 60L)
        );
    }

    private PaystackInitializeResponse toInitializeResponse(Payment payment) {
        return new PaystackInitializeResponse(
                payment.getAuthorizationUrl(),
                payment.getAccessCode(),
                payment.getReference(),
                payment.getOrder().getId(),
                payment.getRide() == null ? null : payment.getRide().getId(),
                payment.getAmountMajor(),
                payment.getCurrency(),
                payment.getStatus()
        );
    }

    private PaystackVerifyResponse toVerifyResponse(Payment payment, String message) {
        return new PaystackVerifyResponse(
                payment.getReference(),
                payment.getStatus(),
                payment.getOrder().getId(),
                payment.getRide() == null ? null : payment.getRide().getId(),
                payment.getAmountMajor(),
                payment.getCurrency(),
                message
        );
    }

    private Map<String, Object> buildMetadata(AppUser customer, Payment payment) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("orderId", payment.getOrder().getId().toString());
        metadata.put("rideId", payment.getRide() == null ? null : payment.getRide().getId().toString());
        metadata.put("userId", customer.getId().toString());
        metadata.put("productSubtotal", payment.getProductSubtotal());
        metadata.put("rideFare", payment.getRideFare());
        metadata.put("grandTotal", payment.getAmountMajor());
        metadata.put("currency", payment.getCurrency());
        return metadata;
    }

    private long toSubunits(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP)
                .movePointRight(2)
                .longValueExact();
    }

    private String generateReference() {
        return "CYM-" + UUID.randomUUID();
    }

    private Payment getPayment(String reference) {
        return paymentRepository.findByReference(reference)
                .orElseThrow(() -> new IllegalArgumentException("Payment reference was not found"));
    }

    private void assertCanAccess(Payment payment) {
        AppUser currentUser = appUserService.getCurrentUser();
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }

        AppUser customer = payment.getOrder().getCustomer();
        if (currentUser.getRole() == Role.CUSTOMER
                && customer != null
                && currentUser.getId().equals(customer.getId())) {
            return;
        }

        throw new IllegalArgumentException("You cannot access this payment");
    }

    private PaymentStatus mapPaystackStatus(String status) {
        return switch (status) {
            case "abandoned" -> PaymentStatus.ABANDONED;
            case "reversed" -> PaymentStatus.REFUNDED;
            default -> PaymentStatus.FAILED;
        };
    }

    private void verifyWebhookSignature(String body, String signature) {
        String secret = paystackProperties.resolvedWebhookSecret();
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("PAYSTACK_WEBHOOK_SECRET or PAYSTACK_SECRET_KEY is not configured");
        }
        if (signature == null || signature.isBlank()) {
            throw new IllegalArgumentException("Paystack signature is required");
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            String expected = HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
            if (!constantTimeEquals(expected, signature)) {
                throw new IllegalArgumentException("Invalid Paystack signature");
            }
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Could not verify Paystack signature", exception);
        }
    }

    private boolean constantTimeEquals(String expected, String actual) {
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        byte[] actualBytes = actual.getBytes(StandardCharsets.UTF_8);
        if (expectedBytes.length != actualBytes.length) {
            return false;
        }

        int result = 0;
        for (int index = 0; index < expectedBytes.length; index++) {
            result |= expectedBytes[index] ^ actualBytes[index];
        }
        return result == 0;
    }

    private String toJson(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Could not serialize Paystack verification payload", exception);
        }
    }

    private record CheckoutQuote(
            BigDecimal productSubtotal,
            BigDecimal rideFare,
            BigDecimal grandTotal,
            String currency
    ) {
    }
}
