package com.andwati.orders.model;


import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String customerName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private AppUser customer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 3)
    private String currency = "KES";

    @Column(nullable = false)
    private Instant createdAt;

    private Instant cancelledAt;

    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }

        if (totalAmount == null) {
            totalAmount = BigDecimal.ZERO;
        }

        if (status == null) {
            status = OrderStatus.PENDING;
        }
    }


    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void recalculateTotal() {
        this.totalAmount = items.stream()
                .map(OrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public boolean isCancellable() {
        return status == OrderStatus.PENDING;
    }

    public void cancel() {
        if (!isCancellable()) {
            throw new IllegalStateException("Only pending orders can be cancelled");
        }

        this.status = OrderStatus.CANCELLED;
        this.cancelledAt = Instant.now();
    }

    public void markDeliveredFromRide() {
        if (status == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cancelled orders cannot be delivered");
        }

        if (status == OrderStatus.DELIVERED) {
            return;
        }

        status = OrderStatus.DELIVERED;
    }

    public void updateStatus(OrderStatus nextStatus) {
        if (nextStatus == null) {
            throw new IllegalArgumentException("status is required");
        }

        if (status == OrderStatus.CANCELLED || status == OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Final orders cannot be updated");
        }

        if (nextStatus == OrderStatus.PENDING) {
            throw new IllegalArgumentException("Orders cannot be moved back to pending");
        }

        if (status == OrderStatus.PENDING && (nextStatus == OrderStatus.SHIPPED || nextStatus == OrderStatus.CANCELLED)) {
            status = nextStatus;
            if (nextStatus == OrderStatus.CANCELLED) {
                cancelledAt = Instant.now();
            }
            return;
        }

        if (status == OrderStatus.SHIPPED && nextStatus == OrderStatus.DELIVERED) {
            status = nextStatus;
            return;
        }

        throw new IllegalArgumentException("Invalid order status transition");
    }

    public UUID getId() {
        return id;
    }

    public Order setId(UUID id) {
        this.id = id;
        return this;
    }

    public String getCustomerName() {
        return customerName;
    }

    public Order setCustomerName(String customerName) {
        this.customerName = customerName;
        return this;
    }

    public AppUser getCustomer() {
        return customer;
    }

    public Order setCustomer(AppUser customer) {
        this.customer = customer;
        return this;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public Order setStatus(OrderStatus status) {
        this.status = status;
        return this;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public Order setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
        return this;
    }

    public String getCurrency() {
        return currency;
    }

    public Order setCurrency(String currency) {
        this.currency = currency;
        return this;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Order setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public Order setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
        return this;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public Order setItems(List<OrderItem> items) {
        this.items = items;
        return this;
    }
}
