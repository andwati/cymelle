package com.andwati.orders.services;

import com.andwati.orders.dto.request.CreateRideRequest;
import com.andwati.orders.dto.response.RideResponse;
import com.andwati.orders.mappers.RideMapper;
import com.andwati.orders.model.AppUser;
import com.andwati.orders.model.Order;
import com.andwati.orders.model.Ride;
import com.andwati.orders.model.RideStatus;
import com.andwati.orders.model.Role;
import com.andwati.orders.repository.OrderRepository;
import com.andwati.orders.repository.RideRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RideService {

    private final RideRepository rideRepository;
    private final OrderRepository orderRepository;
    private final AppUserService appUserService;
    private final FareCalculationService fareCalculationService;
    private final RideMapper rideMapper;

    public RideService(
            RideRepository rideRepository,
            OrderRepository orderRepository,
            AppUserService appUserService,
            FareCalculationService fareCalculationService,
            RideMapper rideMapper
    ) {
        this.rideRepository = rideRepository;
        this.orderRepository = orderRepository;
        this.appUserService = appUserService;
        this.fareCalculationService = fareCalculationService;
        this.rideMapper = rideMapper;
    }

    @Transactional
    public RideResponse requestRide(CreateRideRequest request) {
        AppUser customer = appUserService.getCurrentUser();
        if (customer.getRole() != Role.CUSTOMER) {
            throw new IllegalArgumentException("Only customers can request rides");
        }

        Order order = orderRepository.findWithItemsById(request.orderId())
                .orElseThrow(() -> new IllegalArgumentException("Order was not found"));

        if (order.getCustomer() == null || !customer.getId().equals(order.getCustomer().getId())) {
            throw new IllegalArgumentException("You can only request rides for your own orders");
        }

        if (rideRepository.existsByOrder_Id(order.getId())) {
            throw new IllegalArgumentException("This order already has a ride request");
        }

        Ride ride = new Ride()
                .setOrder(order)
                .setCustomer(customer)
                .setPickupLocation(request.pickupLocation().trim())
                .setDropoffLocation(request.dropoffLocation().trim())
                .setDistanceKm(request.distanceKm())
                .setStatus(RideStatus.REQUESTED);

        return rideMapper.toResponse(rideRepository.save(ride));
    }

    @Transactional(readOnly = true)
    public List<RideResponse> listRides() {
        AppUser currentUser = appUserService.getCurrentUser();

        List<Ride> rides = switch (currentUser.getRole()) {
            case ADMIN -> rideRepository.findAllByOrderByRequestedAtDesc();
            case CUSTOMER -> rideRepository.findByCustomer_IdOrderByRequestedAtDesc(currentUser.getId());
            case DRIVER -> {
                var requested = rideRepository.findByStatusOrderByRequestedAtAsc(RideStatus.REQUESTED);
                var assigned = rideRepository.findByDriver_IdOrderByRequestedAtDesc(currentUser.getId());
                yield java.util.stream.Stream.concat(requested.stream(), assigned.stream())
                        .distinct()
                        .toList();
            }
        };

        return rides.stream().map(rideMapper::toResponse).toList();
    }

    @Transactional
    public RideResponse acceptRide(UUID id) {
        AppUser driver = appUserService.getCurrentUser();
        if (driver.getRole() != Role.DRIVER) {
            throw new IllegalArgumentException("Only drivers can accept rides");
        }

        Ride ride = getRideOrThrow(id);
        var fare = fareCalculationService.calculateFare(ride.getDistanceKm(), null);
        ride.accept(driver, fare.calculatedFare(), fare.currency());

        return rideMapper.toResponse(ride);
    }

    @Transactional
    public RideResponse completeRide(UUID id) {
        AppUser driver = appUserService.getCurrentUser();
        if (driver.getRole() != Role.DRIVER) {
            throw new IllegalArgumentException("Only drivers can complete rides");
        }

        Ride ride = getRideOrThrow(id);
        ride.complete(driver);
        completeAttachedOrder(ride);

        return rideMapper.toResponse(ride);
    }

    @Transactional
    public RideResponse cancelRide(UUID id) {
        AppUser currentUser = appUserService.getCurrentUser();
        Ride ride = getRideOrThrow(id);

        if (currentUser.getRole() == Role.CUSTOMER
                && !currentUser.getId().equals(ride.getCustomer().getId())) {
            throw new IllegalArgumentException("You cannot cancel this ride");
        }

        if (currentUser.getRole() == Role.DRIVER) {
            throw new IllegalArgumentException("Drivers cannot cancel rides");
        }

        ride.cancel();
        return rideMapper.toResponse(ride);
    }

    @Transactional
    public RideResponse updateStatus(UUID id, RideStatus status) {
        AppUser currentUser = appUserService.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Only admins can update ride status");
        }

        Ride ride = getRideOrThrow(id);

        if (status == RideStatus.CANCELLED) {
            ride.cancel();
        } else if (status == RideStatus.COMPLETED) {
            if (ride.getDriver() == null) {
                throw new IllegalArgumentException("A ride must have a driver before completion");
            }
            ride.setStatus(RideStatus.COMPLETED).setCompletedAt(java.time.Instant.now());
            completeAttachedOrder(ride);
        } else {
            throw new IllegalArgumentException("Admins can only cancel or complete rides");
        }

        return rideMapper.toResponse(ride);
    }

    private Ride getRideOrThrow(UUID id) {
        return rideRepository.findWithUsersById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ride was not found"));
    }

    private void completeAttachedOrder(Ride ride) {
        if (ride.getOrder() != null) {
            ride.getOrder().markDeliveredFromRide();
        }
    }
}
