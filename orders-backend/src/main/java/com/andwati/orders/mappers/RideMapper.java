package com.andwati.orders.mappers;

import com.andwati.orders.dto.response.RideResponse;
import com.andwati.orders.model.Ride;
import org.springframework.stereotype.Component;

@Component
public class RideMapper {

    public RideResponse toResponse(Ride ride) {
        return new RideResponse(
                ride.getId(),
                ride.getOrder() == null ? null : ride.getOrder().getId(),
                ride.getCustomer().getId(),
                ride.getCustomer().getDisplayName(),
                ride.getDriver() == null ? null : ride.getDriver().getId(),
                ride.getDriver() == null ? null : ride.getDriver().getDisplayName(),
                ride.getPickupLocation(),
                ride.getDropoffLocation(),
                ride.getDistanceKm(),
                ride.getFareAmount(),
                ride.getCurrency(),
                ride.getStatus(),
                ride.getRequestedAt(),
                ride.getAcceptedAt(),
                ride.getCompletedAt(),
                ride.getCancelledAt()
        );
    }
}
