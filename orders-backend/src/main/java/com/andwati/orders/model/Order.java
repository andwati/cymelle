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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrderStatus status = OrderStatus.PLACED;

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
            status = OrderStatus.PLACED;
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
        return status == OrderStatus.PLACED;
    }

    public void cancel() {
        this.status = OrderStatus.CANCELLED;
        this.cancelledAt = Instant.now();
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
