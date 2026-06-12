package com.andwati.orders.mappers;

import com.andwati.orders.dto.response.CancelOrderResponse;
import com.andwati.orders.dto.response.OrderItemResponse;
import com.andwati.orders.dto.response.OrderResponse;
import com.andwati.orders.dto.response.OrderSummaryResponse;
import com.andwati.orders.model.Order;
import com.andwati.orders.model.OrderItem;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {

    public OrderResponse toResponse(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getCustomerName(),
                order.getStatus(),
                order.getItems().stream().map(this::toItemResponse).toList(),
                order.getTotalAmount(),
                order.getCurrency(),
                order.getCreatedAt(),
                order.getCancelledAt()
        );
    }

    public OrderSummaryResponse toSummaryResponse(Order order) {
        int itemCount = order.getItems()
                .stream()
                .mapToInt(OrderItem::getQuantity)
                .sum();

        return new OrderSummaryResponse(
                order.getId(),
                order.getCustomerName(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getCurrency(),
                itemCount,
                order.getCreatedAt(),
                order.getCancelledAt()
        );
    }

    public CancelOrderResponse toCancelResponse(Order order) {
        return new CancelOrderResponse(
                order.getId(),
                order.getStatus(),
                order.getCancelledAt(),
                true
        );
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getProduct().getId(),
                item.getProductName(),
                item.getQuantity(),
                item.getUnitPrice(),
                item.getLineTotal()
        );
    }
}