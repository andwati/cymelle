package com.andwati.orders.repository;

import com.andwati.orders.model.Payment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    @EntityGraph(attributePaths = {"order", "order.customer", "ride"})
    Optional<Payment> findByReference(String reference);
}
