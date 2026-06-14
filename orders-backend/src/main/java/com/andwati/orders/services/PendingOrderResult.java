package com.andwati.orders.services;

import com.andwati.orders.model.Order;
import com.andwati.orders.model.Ride;

public record PendingOrderResult(Order order, Ride ride) {
}
