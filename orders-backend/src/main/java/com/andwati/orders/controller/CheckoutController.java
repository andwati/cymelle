package com.andwati.orders.controller;

import com.andwati.orders.dto.request.CheckoutQuoteRequest;
import com.andwati.orders.dto.request.CreateOrderRequest;
import com.andwati.orders.dto.response.CheckoutQuoteResponse;
import com.andwati.orders.dto.response.SimulatedCheckoutResponse;
import com.andwati.orders.services.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Checkout", description = "Quote totals and simulate ecommerce checkout")
@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final PaymentService paymentService;

    public CheckoutController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Operation(
            summary = "Quote checkout totals",
            description = "Calculates product subtotal, optional delivery ride fare, and grand total from current backend data."
    )
    @PostMapping("/quote")
    public CheckoutQuoteResponse quote(@Valid @RequestBody CheckoutQuoteRequest request) {
        return paymentService.quote(request);
    }

    @Operation(
            summary = "Simulate checkout",
            description = "Creates a pending order, optional delivery ride, and a paid local payment record without an external provider."
    )
    @PostMapping("/simulate")
    public SimulatedCheckoutResponse simulate(@Valid @RequestBody CreateOrderRequest request) {
        return paymentService.simulateCheckout(request);
    }
}
