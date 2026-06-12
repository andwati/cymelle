package com.andwati.orders.config;


import com.andwati.orders.model.*;
import com.andwati.orders.repository.InventoryItemRepository;
import com.andwati.orders.repository.OrderRepository;
import com.andwati.orders.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final OrderRepository orderRepository;
    private final boolean seedData;


    public DataSeeder(
            ProductRepository productRepository,
            InventoryItemRepository inventoryItemRepository,
            OrderRepository orderRepository,
            @Value("${app.seed-data:true}") boolean seedData
    ) {
        this.productRepository = productRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.orderRepository = orderRepository;
        this.seedData = seedData;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedData || productRepository.count() > 0) {
            return;
        }


        Product mouse = product("Wireless Mouse", "MOUSE-001", "1500.00");
        Product keyboard = product("Keyboard", "KEYBOARD-001", "2500.00");
        Product cable = product("USB-C Cable", "USB-C-001", "800.00");
        Product stand = product("Laptop Stand", "STAND-001", "3500.00");
        Product webcam = product("Webcam", "WEBCAM-001", "4500.00");

        productRepository.saveAll(List.of(mouse, keyboard, cable, stand, webcam));

        inventoryItemRepository.saveAll(List.of(
                inventory(mouse, 12, 5),
                inventory(keyboard, 3, 5),
                inventory(cable, 0, 5),
                inventory(stand, 7, 5),
                inventory(webcam, 2, 5)
        ));
        Order placedOrder = new Order();
        placedOrder.setCustomerName("Demo Customer");
        placedOrder.setStatus(OrderStatus.PLACED);
        placedOrder.setCurrency("KES");
        placedOrder.setCreatedAt(Instant.now().minusSeconds(3600));

        OrderItem itemOne = new OrderItem();
        itemOne.setOrder(placedOrder);
        itemOne.setProduct(mouse);
        itemOne.setProductName(mouse.getName());
        itemOne.setQuantity(1);
        itemOne.setUnitPrice(mouse.getPrice());
        itemOne.setLineTotal(mouse.getPrice());

        OrderItem itemTwo = new OrderItem();
        itemTwo.setOrder(placedOrder);
        itemTwo.setProduct(keyboard);
        itemTwo.setProductName(keyboard.getName());
        itemTwo.setQuantity(1);
        itemTwo.setUnitPrice(keyboard.getPrice());
        itemTwo.setLineTotal(keyboard.getPrice());

        placedOrder.addItem(itemOne);
        placedOrder.addItem(itemTwo);
        placedOrder.recalculateTotal();

        Order cancelledOrder = new Order();
        cancelledOrder.setCustomerName("Cancelled Customer");
        cancelledOrder.setStatus(OrderStatus.CANCELLED);
        cancelledOrder.setCurrency("KES");
        cancelledOrder.setCreatedAt(Instant.now().minusSeconds(86_400));
        cancelledOrder.setCancelledAt(Instant.now().minusSeconds(80_000));

        OrderItem cancelledItem = new OrderItem();
        cancelledItem.setOrder(cancelledOrder);
        cancelledItem.setProduct(webcam);
        cancelledItem.setProductName(webcam.getName());
        cancelledItem.setQuantity(1);
        cancelledItem.setUnitPrice(webcam.getPrice());
        cancelledItem.setLineTotal(webcam.getPrice());

        cancelledOrder.addItem(cancelledItem);
        cancelledOrder.recalculateTotal();

        orderRepository.saveAll(List.of(placedOrder, cancelledOrder));
    }


    private Product product(String name, String sku, String price) {
        Product product = new Product();
        product.setName(name);
        product.setSku(sku);
        product.setPrice(new BigDecimal(price));
        product.setCurrency("KES");
        product.setActive(true);
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());
        return product;
    }

    private InventoryItem inventory(Product product, int availableQuantity, int reorderLevel) {
        InventoryItem inventoryItem = new InventoryItem();
        inventoryItem.setProduct(product);
        inventoryItem.setAvailableQuantity(availableQuantity);
        inventoryItem.setReservedQuantity(0);
        inventoryItem.setReorderLevel(reorderLevel);
        inventoryItem.setUpdatedAt(Instant.now());
        return inventoryItem;
    }
}
