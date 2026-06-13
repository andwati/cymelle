package com.andwati.orders.controller;

import com.andwati.orders.dto.request.CreateRideRequest;
import com.andwati.orders.dto.request.UpdateRideStatusRequest;
import com.andwati.orders.dto.response.RideResponse;
import com.andwati.orders.services.RideService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rides")
public class RideController {

    private final RideService rideService;

    public RideController(RideService rideService) {
        this.rideService = rideService;
    }

    @GetMapping
    public List<RideResponse> listRides() {
        return rideService.listRides();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RideResponse requestRide(@Valid @RequestBody CreateRideRequest request) {
        return rideService.requestRide(request);
    }

    @PostMapping("/{id}/accept")
    public RideResponse acceptRide(@PathVariable UUID id) {
        return rideService.acceptRide(id);
    }

    @PostMapping("/{id}/complete")
    public RideResponse completeRide(@PathVariable UUID id) {
        return rideService.completeRide(id);
    }

    @DeleteMapping("/{id}")
    public RideResponse cancelRide(@PathVariable UUID id) {
        return rideService.cancelRide(id);
    }

    @PatchMapping("/{id}/status")
    public RideResponse updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRideStatusRequest request
    ) {
        return rideService.updateStatus(id, request.status());
    }
}
