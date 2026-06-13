package com.andwati.orders.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rides")
public class Ride {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private AppUser customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private AppUser driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(nullable = false, length = 160)
    private String pickupLocation;

    @Column(nullable = false, length = 160)
    private String dropoffLocation;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal distanceKm;

    @Column(precision = 12, scale = 2)
    private BigDecimal fareAmount;

    @Column(nullable = false, length = 3)
    private String currency = "KES";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RideStatus status = RideStatus.REQUESTED;

    @Column(nullable = false)
    private Instant requestedAt;

    private Instant acceptedAt;

    private Instant completedAt;

    private Instant cancelledAt;

    @PrePersist
    public void prePersist() {
        if (requestedAt == null) {
            requestedAt = Instant.now();
        }

        if (status == null) {
            status = RideStatus.REQUESTED;
        }
    }

    public void accept(AppUser driver, BigDecimal fareAmount, String currency) {
        if (status != RideStatus.REQUESTED) {
            throw new IllegalArgumentException("Only requested rides can be accepted");
        }

        this.driver = driver;
        this.fareAmount = fareAmount;
        this.currency = currency;
        this.status = RideStatus.ACCEPTED;
        this.acceptedAt = Instant.now();
    }

    public void complete(AppUser driver) {
        if (status != RideStatus.ACCEPTED) {
            throw new IllegalArgumentException("Only accepted rides can be completed");
        }

        if (this.driver == null || !this.driver.getId().equals(driver.getId())) {
            throw new IllegalArgumentException("Only the assigned driver can complete this ride");
        }

        this.status = RideStatus.COMPLETED;
        this.completedAt = Instant.now();
    }

    public void cancel() {
        if (status == RideStatus.COMPLETED) {
            throw new IllegalArgumentException("Completed rides cannot be cancelled");
        }

        this.status = RideStatus.CANCELLED;
        this.cancelledAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public Ride setId(UUID id) {
        this.id = id;
        return this;
    }

    public AppUser getCustomer() {
        return customer;
    }

    public Ride setCustomer(AppUser customer) {
        this.customer = customer;
        return this;
    }

    public AppUser getDriver() {
        return driver;
    }

    public Ride setDriver(AppUser driver) {
        this.driver = driver;
        return this;
    }

    public Order getOrder() {
        return order;
    }

    public Ride setOrder(Order order) {
        this.order = order;
        return this;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public Ride setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
        return this;
    }

    public String getDropoffLocation() {
        return dropoffLocation;
    }

    public Ride setDropoffLocation(String dropoffLocation) {
        this.dropoffLocation = dropoffLocation;
        return this;
    }

    public BigDecimal getDistanceKm() {
        return distanceKm;
    }

    public Ride setDistanceKm(BigDecimal distanceKm) {
        this.distanceKm = distanceKm;
        return this;
    }

    public BigDecimal getFareAmount() {
        return fareAmount;
    }

    public Ride setFareAmount(BigDecimal fareAmount) {
        this.fareAmount = fareAmount;
        return this;
    }

    public String getCurrency() {
        return currency;
    }

    public Ride setCurrency(String currency) {
        this.currency = currency;
        return this;
    }

    public RideStatus getStatus() {
        return status;
    }

    public Ride setStatus(RideStatus status) {
        this.status = status;
        return this;
    }

    public Instant getRequestedAt() {
        return requestedAt;
    }

    public Ride setRequestedAt(Instant requestedAt) {
        this.requestedAt = requestedAt;
        return this;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public Ride setAcceptedAt(Instant acceptedAt) {
        this.acceptedAt = acceptedAt;
        return this;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public Ride setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
        return this;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public Ride setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
        return this;
    }
}
