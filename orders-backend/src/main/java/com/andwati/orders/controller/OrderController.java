package com.andwati.orders.controller;

import com.andwati.orders.dto.request.CreateOrderRequest;
import com.andwati.orders.dto.response.CancelOrderResponse;
import com.andwati.orders.dto.response.OrderResponse;
import com.andwati.orders.dto.response.OrderSummaryResponse;
import com.andwati.orders.dto.response.PageResponse;
import com.andwati.orders.model.OrderStatus;
import com.andwati.orders.services.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

    @Operation(
            summary = "Place an order",
            description = """
                    Creates a new order for one or more products. The API validates that products exist, are active,
                    and have enough available stock, then deducts the ordered quantities from inventory.
                    """
    )
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse placeOrder(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.placeOrder(request);
    }

    @Operation(
            summary = "List orders",
            description = """
                    Returns a paginated list of order summaries sorted by newest first. Results can be filtered by
                    order status and by an inclusive created-date range.
                    """
    )
    @GetMapping
    public PageResponse<OrderSummaryResponse> listOrders(
            @Parameter(description = "Optional order status filter.", example = "PLACED")
            @RequestParam(required = false) OrderStatus status,

            @Parameter(
                    description = "Optional start date for the created-date filter, inclusive.",
                    example = "2026-06-01"
            )
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate from,

            @Parameter(
                    description = "Optional end date for the created-date filter, inclusive.",
                    example = "2026-06-30"
            )
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate to,

            @Parameter(description = "Zero-based page index.", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(
                    description = "Page size. Values are normalized to the supported range of 1 to 100.",
                    example = "20"
            )
            @RequestParam(defaultValue = "20") int size
    ) {
        return orderService.listOrders(status, from, to, page, size);
    }

    @Operation(
            summary = "Get an order",
            description = "Returns a single order by ID, including its line items, totals, status, and timestamps."
    )
    @GetMapping("/{id}")
    public OrderResponse getOrder(
            @Parameter(description = "Order ID.", example = "11111111-1111-1111-1111-111111111111")
            @PathVariable UUID id
    ) {
        return orderService.getOrder(id);
    }

    @Operation(
            summary = "Cancel an order",
            description = """
                    Cancels an existing order when it is still cancellable and restores the ordered quantities back
                    into inventory. Orders that are already cancelled or otherwise not cancellable are rejected.
                    """
    )
    @DeleteMapping("/{id}")
    public CancelOrderResponse cancelOrder(
            @Parameter(description = "Order ID.", example = "11111111-1111-1111-1111-111111111111")
            @PathVariable UUID id
    ) {
        return orderService.cancelOrder(id);
    }
}
