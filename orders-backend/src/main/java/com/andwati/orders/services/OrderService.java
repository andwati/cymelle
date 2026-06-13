package com.andwati.orders.services;

import com.andwati.orders.dto.request.CreateOrderRequest;
import com.andwati.orders.dto.response.CancelOrderResponse;
import com.andwati.orders.dto.response.OrderResponse;
import com.andwati.orders.dto.response.OrderSummaryResponse;
import com.andwati.orders.dto.response.PageResponse;
import com.andwati.orders.exception.*;
import com.andwati.orders.mappers.OrderMapper;
import com.andwati.orders.model.*;
import com.andwati.orders.repository.InventoryItemRepository;
import com.andwati.orders.repository.OrderRepository;
import com.andwati.orders.repository.ProductRepository;
import com.andwati.orders.repository.RideRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final RideRepository rideRepository;
    private final OrderMapper orderMapper;
    private final AppUserService appUserService;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            InventoryItemRepository inventoryItemRepository,
            RideRepository rideRepository,
            OrderMapper orderMapper,
            AppUserService appUserService
    ) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.rideRepository = rideRepository;
        this.orderMapper = orderMapper;
        this.appUserService = appUserService;
    }

    @Transactional
    public OrderResponse placeOrder(CreateOrderRequest request) {
        AppUser customer = appUserService.getCurrentUser();
        if (customer.getRole() != Role.CUSTOMER) {
            throw new IllegalArgumentException("Only customers can place orders");
        }

        Map<UUID, Integer> requestedQuantities = normalizeItems(request);

        Map<UUID, Product> productsById = productRepository.findByIdIn(requestedQuantities.keySet())
                .stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        validateProductsExistAndActive(requestedQuantities, productsById);

        Map<UUID, InventoryItem> inventoryByProductId = inventoryItemRepository
                .findByProductIdsForUpdate(requestedQuantities.keySet())
                .stream()
                .collect(Collectors.toMap(
                        inventory -> inventory.getProduct().getId(),
                        Function.identity()
                ));

        validateInventoryExists(requestedQuantities, inventoryByProductId);
        validateStockAvailability(requestedQuantities, inventoryByProductId);

        Order order = new Order();
        order.setCustomer(customer);
        order.setCustomerName(customer.getDisplayName());
        order.setStatus(OrderStatus.PENDING);
        order.setCurrency("KES");
        order.setCreatedAt(Instant.now());

        for (Map.Entry<UUID, Integer> entry : requestedQuantities.entrySet()) {
            UUID productId = entry.getKey();
            int quantity = entry.getValue();

            Product product = productsById.get(productId);
            InventoryItem inventoryItem = inventoryByProductId.get(productId);

            inventoryItem.deduct(quantity);

            OrderItem orderItem = OrderItem.from(product, quantity);
            order.addItem(orderItem);
        }

        order.recalculateTotal();

        Order savedOrder = orderRepository.save(order);

        if (request.deliveryRide() != null) {
            Ride ride = new Ride()
                    .setOrder(savedOrder)
                    .setCustomer(customer)
                    .setPickupLocation(request.deliveryRide().pickupLocation().trim())
                    .setDropoffLocation(request.deliveryRide().dropoffLocation().trim())
                    .setDistanceKm(request.deliveryRide().distanceKm())
                    .setStatus(RideStatus.REQUESTED);

            rideRepository.save(ride);
        }

        return orderMapper.toResponse(savedOrder);
    }

    @Transactional
    public CancelOrderResponse cancelOrder(UUID orderId) {
        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        assertCanAccessOrder(order);

        if (!order.isCancellable()) {
            throw new OrderNotCancellableException(orderId);
        }

        var productIds = order.getItems()
                .stream()
                .map(item -> item.getProduct().getId())
                .toList();

        Map<UUID, InventoryItem> inventoryByProductId = inventoryItemRepository
                .findByProductIdsForUpdate(productIds)
                .stream()
                .collect(Collectors.toMap(
                        inventory -> inventory.getProduct().getId(),
                        Function.identity()
                ));

        for (OrderItem item : order.getItems()) {
            UUID productId = item.getProduct().getId();
            InventoryItem inventoryItem = inventoryByProductId.get(productId);

            if (inventoryItem == null) {
                throw new InventoryNotFoundException(productId);
            }

            inventoryItem.restore(item.getQuantity());
        }

        order.cancel();

        return orderMapper.toCancelResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID orderId) {
        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        assertCanAccessOrder(order);

        return orderMapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> listOrders(
            OrderStatus status,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

        var pageable = PageRequest.of(
                safePage,
                safeSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        AppUser currentUser = appUserService.getCurrentUser();

        var result = orderRepository.findAll(buildOrderSpecification(status, from, to, currentUser), pageable);

        var items = result.getContent()
                .stream()
                .map(orderMapper::toSummaryResponse)
                .toList();

        return new PageResponse<>(
                items,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    @Transactional
    public OrderResponse updateStatus(UUID orderId, OrderStatus status) {
        AppUser currentUser = appUserService.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only admins can update order status");
        }

        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> new OrderNotFoundException(orderId));

        if (status == OrderStatus.CANCELLED && order.isCancellable()) {
            cancelOrder(orderId);
            return orderMapper.toResponse(order);
        }

        order.updateStatus(status);
        return orderMapper.toResponse(order);
    }

    private Map<UUID, Integer> normalizeItems(CreateOrderRequest request) {
        Map<UUID, Integer> quantities = new HashMap<>();

        request.items().forEach(item -> quantities.merge(
                item.productId(),
                item.quantity(),
                Integer::sum
        ));

        return quantities;
    }

    private void validateProductsExistAndActive(
            Map<UUID, Integer> requestedQuantities,
            Map<UUID, Product> productsById
    ) {
        for (UUID productId : requestedQuantities.keySet()) {
            Product product = productsById.get(productId);

            if (product == null) {
                throw new ProductNotFoundException(productId);
            }

            if (!product.isActive()) {
                throw new IllegalArgumentException("Product " + product.getName() + " is not active");
            }
        }
    }

    private void validateInventoryExists(
            Map<UUID, Integer> requestedQuantities,
            Map<UUID, InventoryItem> inventoryByProductId
    ) {
        for (UUID productId : requestedQuantities.keySet()) {
            if (!inventoryByProductId.containsKey(productId)) {
                throw new InventoryNotFoundException(productId);
            }
        }
    }

    private void validateStockAvailability(
            Map<UUID, Integer> requestedQuantities,
            Map<UUID, InventoryItem> inventoryByProductId
    ) {
        for (Map.Entry<UUID, Integer> entry : requestedQuantities.entrySet()) {
            UUID productId = entry.getKey();
            int requestedQuantity = entry.getValue();
            InventoryItem inventoryItem = inventoryByProductId.get(productId);

            if (!inventoryItem.hasEnoughStock(requestedQuantity)) {
                throw new InsufficientStockException(
                        productId,
                        inventoryItem.getProduct().getName(),
                        requestedQuantity,
                        inventoryItem.getAvailableQuantity()
                );
            }
        }
    }

    private Specification<Order> buildOrderSpecification(
            OrderStatus status,
            LocalDate from,
            LocalDate to,
            AppUser currentUser
    ) {
        return (root, query, criteriaBuilder) -> {
            var predicates = new java.util.ArrayList<Predicate>();

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (from != null) {
                Instant fromInstant = from.atStartOfDay().toInstant(ZoneOffset.UTC);
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), fromInstant));
            }

            if (to != null) {
                Instant toExclusive = to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
                predicates.add(criteriaBuilder.lessThan(root.get("createdAt"), toExclusive));
            }

            if (currentUser.getRole() == Role.CUSTOMER) {
                predicates.add(criteriaBuilder.equal(root.get("customer").get("id"), currentUser.getId()));
            } else if (currentUser.getRole() != Role.ADMIN) {
                predicates.add(criteriaBuilder.disjunction());
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void assertCanAccessOrder(Order order) {
        AppUser currentUser = appUserService.getCurrentUser();

        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }

        if (currentUser.getRole() == Role.CUSTOMER
                && order.getCustomer() != null
                && currentUser.getId().equals(order.getCustomer().getId())) {
            return;
        }

        throw new IllegalArgumentException("You cannot access this order");
    }
}
