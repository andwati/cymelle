package com.andwati.orders.controller;

import com.andwati.orders.dto.request.PaystackInitializeRequest;
import com.andwati.orders.dto.response.PaystackInitializeResponse;
import com.andwati.orders.dto.response.PaystackVerifyResponse;
import com.andwati.orders.services.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Paystack Payments", description = "Initialize and verify Paystack checkout payments")
@RestController
@RequestMapping("/api/payments/paystack")
public class PaystackPaymentController {

    private final PaymentService paymentService;

    public PaystackPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @Operation(
            summary = "Initialize Paystack checkout",
            description = "Creates pending order, optional ride, payment record, and returns a Paystack authorization URL."
    )
    @PostMapping("/initialize")
    public PaystackInitializeResponse initialize(@Valid @RequestBody PaystackInitializeRequest request) {
        return paymentService.initialize(request);
    }

    @Operation(
            summary = "Verify Paystack payment",
            description = "Verifies the Paystack transaction and marks the payment paid only when reference, amount, and currency match."
    )
    @PostMapping("/verify/{reference}")
    public PaystackVerifyResponse verify(@PathVariable String reference) {
        return paymentService.verify(reference);
    }

    @Operation(summary = "Receive Paystack webhook events")
    @PostMapping("/webhook")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void webhook(
            @RequestBody String body,
            @RequestHeader(name = "x-paystack-signature", required = false) String signature
    ) {
        paymentService.handleWebhook(body, signature);
    }
}
