package com.andwati.orders.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "payments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_payments_reference", columnNames = "reference")
        }
)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ride_id")
    private Ride ride;

    @Column(nullable = false, length = 80)
    private String reference;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal productSubtotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal rideFare;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amountMajor;

    @Column(nullable = false)
    private long amountSubunits;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(length = 512)
    private String authorizationUrl;

    @Column(length = 120)
    private String accessCode;

    @Lob
    private String rawVerificationPayload;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant paidAt;

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
        if (status == null) {
            status = PaymentStatus.PENDING;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    public void markPaid(String rawPayload) {
        if (status == PaymentStatus.PAID) {
            this.rawVerificationPayload = rawPayload;
            return;
        }

        this.status = PaymentStatus.PAID;
        this.paidAt = Instant.now();
        this.rawVerificationPayload = rawPayload;
    }

    public void markFailed(PaymentStatus status, String rawPayload) {
        if (this.status == PaymentStatus.PAID) {
            return;
        }

        this.status = status;
        this.rawVerificationPayload = rawPayload;
    }

    public UUID getId() {
        return id;
    }

    public Payment setId(UUID id) {
        this.id = id;
        return this;
    }

    public Order getOrder() {
        return order;
    }

    public Payment setOrder(Order order) {
        this.order = order;
        return this;
    }

    public Ride getRide() {
        return ride;
    }

    public Payment setRide(Ride ride) {
        this.ride = ride;
        return this;
    }

    public String getReference() {
        return reference;
    }

    public Payment setReference(String reference) {
        this.reference = reference;
        return this;
    }

    public BigDecimal getProductSubtotal() {
        return productSubtotal;
    }

    public Payment setProductSubtotal(BigDecimal productSubtotal) {
        this.productSubtotal = productSubtotal;
        return this;
    }

    public BigDecimal getRideFare() {
        return rideFare;
    }

    public Payment setRideFare(BigDecimal rideFare) {
        this.rideFare = rideFare;
        return this;
    }

    public BigDecimal getAmountMajor() {
        return amountMajor;
    }

    public Payment setAmountMajor(BigDecimal amountMajor) {
        this.amountMajor = amountMajor;
        return this;
    }

    public long getAmountSubunits() {
        return amountSubunits;
    }

    public Payment setAmountSubunits(long amountSubunits) {
        this.amountSubunits = amountSubunits;
        return this;
    }

    public String getCurrency() {
        return currency;
    }

    public Payment setCurrency(String currency) {
        this.currency = currency;
        return this;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public Payment setStatus(PaymentStatus status) {
        this.status = status;
        return this;
    }

    public String getAuthorizationUrl() {
        return authorizationUrl;
    }

    public Payment setAuthorizationUrl(String authorizationUrl) {
        this.authorizationUrl = authorizationUrl;
        return this;
    }

    public String getAccessCode() {
        return accessCode;
    }

    public Payment setAccessCode(String accessCode) {
        this.accessCode = accessCode;
        return this;
    }

    public String getRawVerificationPayload() {
        return rawVerificationPayload;
    }

    public Payment setRawVerificationPayload(String rawVerificationPayload) {
        this.rawVerificationPayload = rawVerificationPayload;
        return this;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Payment setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public Payment setPaidAt(Instant paidAt) {
        this.paidAt = paidAt;
        return this;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Payment setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
        return this;
    }
}
