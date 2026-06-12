package com.andwati.orders.model;


import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "products",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_products_sku", columnNames = "sku")
        }
)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 80)
    private String sku;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 3)
    private String currency = "KES";

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();

        if (createdAt == null) {
            createdAt = now;
        }

        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public Product setName(String name) {
        this.name = name;
        return this;
    }

    public String getSku() {
        return sku;
    }

    public Product setSku(String sku) {

        this.sku = sku;
        return this;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Product setPrice(BigDecimal price) {
        this.price = price;
        return this;
    }

    public String getCurrency() {
        return currency;
    }

    public Product setCurrency(String currency) {
        this.currency = currency;
        return this;
    }

    public boolean isActive() {
        return active;
    }

    public Product setActive(boolean active) {
        this.active = active;
        return this;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Product setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Product setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
        return this;
    }
}
