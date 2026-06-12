package com.andwati.orders.controller;

import com.andwati.orders.dto.request.CreateOrderRequest;
import com.andwati.orders.dto.response.CancelOrderResponse;
import com.andwati.orders.dto.response.OrderResponse;
import com.andwati.orders.dto.response.OrderSummaryResponse;
import com.andwati.orders.dto.response.PageResponse;
import com.andwati.orders.model.OrderStatus;
import com.andwati.orders.services.OrderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@Tag(name = "Orders", description = "Place, list, view, and cancel orders")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse placeOrder(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.placeOrder(request);
    }

    @GetMapping
    public PageResponse<OrderSummaryResponse> listOrders(
            @RequestParam(required = false) OrderStatus status,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return orderService.listOrders(status, from, to, page, size);
    }

    @GetMapping("/{id}")
    public OrderResponse getOrder(@PathVariable UUID id) {
        return orderService.getOrder(id);
    }

    @DeleteMapping("/{id}")
    public CancelOrderResponse cancelOrder(@PathVariable UUID id) {
        return orderService.cancelOrder(id);
    }
}