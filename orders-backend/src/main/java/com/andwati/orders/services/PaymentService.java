package com.andwati.orders.services;

import com.andwati.orders.dto.request.CheckoutQuoteRequest;
import com.andwati.orders.dto.request.CreateOrderRequest;
import com.andwati.orders.dto.response.CheckoutQuoteResponse;
import com.andwati.orders.dto.response.FareCalculationResponse;
import com.andwati.orders.dto.response.SimulatedCheckoutResponse;
import com.andwati.orders.exception.InsufficientStockException;
import com.andwati.orders.exception.InventoryNotFoundException;
import com.andwati.orders.exception.ProductNotFoundException;
import com.andwati.orders.model.*;
import com.andwati.orders.repository.InventoryItemRepository;
import com.andwati.orders.repository.PaymentRepository;
import com.andwati.orders.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
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

    public PaymentService(
            ProductRepository productRepository,
            InventoryItemRepository inventoryItemRepository,
            PaymentRepository paymentRepository,
            FareCalculationService fareCalculationService,
            OrderService orderService,
            AppUserService appUserService
    ) {
        this.productRepository = productRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.paymentRepository = paymentRepository;
        this.fareCalculationService = fareCalculationService;
        this.orderService = orderService;
        this.appUserService = appUserService;
    }

    @Transactional(readOnly = true)
    public CheckoutQuoteResponse quote(CheckoutQuoteRequest request) {
        CheckoutQuote quote = calculateQuote(request.items(), request.deliveryRide());
        return toQuoteResponse(quote);
    }

    @Transactional
    public SimulatedCheckoutResponse simulateCheckout(CreateOrderRequest request) {
        AppUser customer = appUserService.getCurrentUser();
        if (customer.getRole() != Role.CUSTOMER) {
            throw new IllegalArgumentException("Only customers can checkout");
        }

        CheckoutQuote quote = calculateQuote(request.items(), request.deliveryRide());
        PendingOrderResult pendingOrder = orderService.createPendingOrder(
                customer,
                request,
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
        payment.markPaid(buildSimulatedPayload(customer, payment));

        return toSimulatedCheckoutResponse(payment);
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

    private SimulatedCheckoutResponse toSimulatedCheckoutResponse(Payment payment) {
        return new SimulatedCheckoutResponse(
                payment.getReference(),
                payment.getOrder().getId(),
                payment.getRide() == null ? null : payment.getRide().getId(),
                payment.getAmountMajor(),
                payment.getCurrency(),
                payment.getStatus(),
                "Checkout simulated successfully"
        );
    }

    private String buildSimulatedPayload(AppUser customer, Payment payment) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("provider", "simulated");
        metadata.put("reference", payment.getReference());
        metadata.put("orderId", payment.getOrder().getId().toString());
        metadata.put("rideId", payment.getRide() == null ? null : payment.getRide().getId().toString());
        metadata.put("userId", customer.getId().toString());
        metadata.put("productSubtotal", payment.getProductSubtotal());
        metadata.put("rideFare", payment.getRideFare());
        metadata.put("grandTotal", payment.getAmountMajor());
        metadata.put("currency", payment.getCurrency());
        metadata.put("status", PaymentStatus.PAID.name());
        return metadata.toString();
    }

    private long toSubunits(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP)
                .movePointRight(2)
                .longValueExact();
    }

    private String generateReference() {
        return "CYM-" + UUID.randomUUID();
    }

    private record CheckoutQuote(
            BigDecimal productSubtotal,
            BigDecimal rideFare,
            BigDecimal grandTotal,
            String currency
    ) {
    }
}
