package com.andwati.orders.model;


import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inventory_items", uniqueConstraints = {
        @UniqueConstraint(name = "uk_inventory_product", columnNames = "product_id")
})
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;


    @Column(nullable = false)
    private int availableQuantity;

    @Column(nullable = false)
    private int reservedQuantity;

    @Column(nullable = false)
    private int reorderLevel;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public boolean hasEnoughStock(int requestedQuantity) {
        return availableQuantity >= requestedQuantity;
    }


    public void deduct(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity to deduct  must be greater than zero");
        }

        if (availableQuantity < quantity) {
            throw new IllegalStateException("Insufficient stock");
        }

        availableQuantity -= quantity;
        updatedAt = Instant.now();
    }

    public void restore(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity to deduct  must be greater than zero");
        }

        availableQuantity += quantity;
        updatedAt = Instant.now();
    }


    public InventoryStatus getStatus() {
        if (availableQuantity == 0) {
            return InventoryStatus.OUT_OF_STOCK;
        }

        if (availableQuantity <= reorderLevel) {
            return InventoryStatus.LOW_STOCK;
        }

        return InventoryStatus.IN_STOCK;
    }

    public UUID getId() {
        return id;
    }

    public InventoryItem setId(UUID id) {
        this.id = id;
        return this;
    }

    public Product getProduct() {
        return product;
    }

    public InventoryItem setProduct(Product product) {
        this.product = product;
        return this;
    }

    public int getAvailableQuantity() {
        return availableQuantity;
    }

    public InventoryItem setAvailableQuantity(int availableQuantity) {
        this.availableQuantity = availableQuantity;
        return this;
    }


    public int getReservedQuantity() {
        return reservedQuantity;
    }

    public InventoryItem setReservedQuantity(int reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
        return this;
    }

    public int getReorderLevel() {
        return reorderLevel;
    }

    public InventoryItem setReorderLevel(int reorderLevel) {
        this.reorderLevel = reorderLevel;
        return this;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public InventoryItem setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
        return this;
    }
}






























