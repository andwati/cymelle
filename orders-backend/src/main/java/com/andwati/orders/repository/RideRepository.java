package com.andwati.orders.repository;

import com.andwati.orders.model.Ride;
import com.andwati.orders.model.RideStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RideRepository extends JpaRepository<Ride, UUID> {

    @EntityGraph(attributePaths = {"customer", "driver", "order"})
    List<Ride> findByCustomer_IdOrderByRequestedAtDesc(UUID customerId);

    @EntityGraph(attributePaths = {"customer", "driver", "order"})
    List<Ride> findByDriver_IdOrderByRequestedAtDesc(UUID driverId);

    @EntityGraph(attributePaths = {"customer", "driver", "order"})
    List<Ride> findByStatusOrderByRequestedAtAsc(RideStatus status);

    @EntityGraph(attributePaths = {"customer", "driver", "order"})
    List<Ride> findAllByOrderByRequestedAtDesc();

    @EntityGraph(attributePaths = {"customer", "driver", "order"})
    Optional<Ride> findWithUsersById(UUID id);

    boolean existsByOrder_Id(UUID orderId);
}
