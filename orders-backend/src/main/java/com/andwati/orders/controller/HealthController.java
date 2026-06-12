package com.andwati.orders.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Tag(name = "Health", description = "Health check endpoint")
@RestController
public class HealthController {

    @Operation(
            summary = "Check API health",
            description = """
                    Returns a lightweight status response that can be used by clients, monitors, or load balancers
                    to verify that the API is running.
                    """
    )
    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
