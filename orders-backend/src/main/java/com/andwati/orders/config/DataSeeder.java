package com.andwati.orders.config;


import com.andwati.orders.model.*;
import com.andwati.orders.repository.AppUserRepository;
import com.andwati.orders.repository.InventoryItemRepository;
import com.andwati.orders.repository.OrderRepository;
import com.andwati.orders.repository.ProductRepository;
import com.andwati.orders.repository.RideRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {
    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final OrderRepository orderRepository;
    private final RideRepository rideRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean seedData;


    public DataSeeder(
            ProductRepository productRepository,
            InventoryItemRepository inventoryItemRepository,
            OrderRepository orderRepository,
            RideRepository rideRepository,
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed-data:true}") boolean seedData
    ) {
        this.productRepository = productRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.orderRepository = orderRepository;
        this.rideRepository = rideRepository;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedData = seedData;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedData) {
            return;
        }

        AppUser admin = ensureUser("admin", "Admin User", "admin123", Role.ADMIN);
        AppUser driver = ensureUser("driver", "Demo Driver", "driver123", Role.DRIVER);
        AppUser driverTwo = ensureUser("driver2", "Amina Driver", "driver123", Role.DRIVER);
        AppUser driverThree = ensureUser("driver3", "Otieno Driver", "driver123", Role.DRIVER);
        AppUser customer = ensureUser("customer", "Demo Customer", "customer123", Role.CUSTOMER);
        AppUser customerTwo = ensureUser("customer2", "Nia Customer", "customer123", Role.CUSTOMER);
        AppUser customerThree = ensureUser("customer3", "Baraka Customer", "customer123", Role.CUSTOMER);
        AppUser customerFour = ensureUser("customer4", "Wanjiku Customer", "customer123", Role.CUSTOMER);

        Product mouse = ensureProduct("Wireless Mouse", "MOUSE-001", "1500.00", 18, 5);
        Product keyboard = ensureProduct("Mechanical Keyboard", "KEYBOARD-001", "4500.00", 9, 4);
        Product cable = ensureProduct("USB-C Cable", "USB-C-001", "800.00", 32, 10);
        Product stand = ensureProduct("Laptop Stand", "STAND-001", "3500.00", 7, 5);
        Product webcam = ensureProduct("Webcam", "WEBCAM-001", "4500.00", 4, 5);
        Product headphones = ensureProduct("Noise Cancelling Headphones", "AUDIO-001", "12500.00", 11, 3);
        Product monitor = ensureProduct("27 Inch Monitor", "MONITOR-001", "28500.00", 6, 2);
        Product dock = ensureProduct("USB-C Docking Station", "DOCK-001", "9200.00", 5, 3);
        Product backpack = ensureProduct("Commuter Laptop Backpack", "BAG-001", "6200.00", 15, 6);
        Product powerBank = ensureProduct("Fast Charge Power Bank", "POWER-001", "5400.00", 12, 4);
        Product tablet = ensureProduct("Drawing Tablet", "TABLET-001", "16900.00", 3, 3);
        Product chair = ensureProduct("Ergonomic Office Chair", "CHAIR-001", "24500.00", 2, 2);

        if (orderRepository.count() < 14) {
            seedActivity(
                    List.of(customer, customerTwo, customerThree, customerFour),
                    List.of(driver, driverTwo, driverThree),
                    List.of(mouse, keyboard, cable, stand, webcam, headphones, monitor, dock, backpack, powerBank, tablet, chair)
            );
        }
    }

    private AppUser ensureUser(String username, String displayName, String password, Role role) {
        return appUserRepository.findByUsernameIgnoreCase(username)
                .orElseGet(() -> appUserRepository.save(new AppUser()
                        .setUsername(username)
                        .setDisplayName(displayName)
                        .setPasswordHash(passwordEncoder.encode(password))
                        .setRole(role)
                        .setEnabled(true)));
    }


    private Product ensureProduct(String name, String sku, String price, int availableQuantity, int reorderLevel) {
        Product product = productRepository.findBySkuIgnoreCase(sku)
                .orElseGet(() -> productRepository.save(product(name, sku, price)));

        inventoryItemRepository.findByProduct_Id(product.getId())
                .orElseGet(() -> inventoryItemRepository.save(inventory(product, availableQuantity, reorderLevel)));

        return product;
    }

    private Product product(String name, String sku, String price) {
        return new Product()
                .setName(name)
                .setSku(sku)
                .setPrice(new BigDecimal(price))
                .setCurrency("KES")
                .setActive(true)
                .setCreatedAt(Instant.now())
                .setUpdatedAt(Instant.now());
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

    private void seedActivity(List<AppUser> customers, List<AppUser> drivers, List<Product> products) {
        Instant now = Instant.now();
        List<Order> orders = List.of(
                order(customers.get(0), OrderStatus.PENDING, now.minusSeconds(2_400), line(products.get(0), 1), line(products.get(2), 2)),
                order(customers.get(1), OrderStatus.PENDING, now.minusSeconds(7_200), line(products.get(8), 1), line(products.get(9), 1)),
                order(customers.get(2), OrderStatus.SHIPPED, now.minusSeconds(26_000), line(products.get(1), 1), line(products.get(3), 1)),
                order(customers.get(3), OrderStatus.SHIPPED, now.minusSeconds(44_000), line(products.get(5), 1)),
                order(customers.get(0), OrderStatus.DELIVERED, now.minusSeconds(91_000), line(products.get(6), 1), line(products.get(2), 3)),
                order(customers.get(1), OrderStatus.DELIVERED, now.minusSeconds(130_000), line(products.get(7), 1), line(products.get(0), 1)),
                order(customers.get(2), OrderStatus.DELIVERED, now.minusSeconds(185_000), line(products.get(10), 1), line(products.get(2), 1)),
                order(customers.get(3), OrderStatus.DELIVERED, now.minusSeconds(252_000), line(products.get(11), 1)),
                order(customers.get(0), OrderStatus.CANCELLED, now.minusSeconds(316_000), line(products.get(4), 1)),
                order(customers.get(1), OrderStatus.PENDING, now.minusSeconds(374_000), line(products.get(3), 1), line(products.get(9), 2)),
                order(customers.get(2), OrderStatus.SHIPPED, now.minusSeconds(442_000), line(products.get(5), 1), line(products.get(8), 1)),
                order(customers.get(3), OrderStatus.DELIVERED, now.minusSeconds(518_000), line(products.get(6), 1), line(products.get(1), 1))
        );
        orderRepository.saveAll(orders);

        rideRepository.saveAll(List.of(
                ride(orders.get(0), null, RideStatus.REQUESTED, "Westlands warehouse", "Kilimani, Nairobi", "7.20", null, now.minusSeconds(2_100)),
                ride(orders.get(1), null, RideStatus.REQUESTED, "Mombasa Road hub", "Syokimau", "11.50", null, now.minusSeconds(6_800)),
                ride(orders.get(2), drivers.get(0), RideStatus.ACCEPTED, "CBD pickup", "Lavington", "6.30", "950.00", now.minusSeconds(24_000)),
                ride(orders.get(3), drivers.get(1), RideStatus.ACCEPTED, "Industrial Area", "Kileleshwa", "8.40", "1180.00", now.minusSeconds(42_000)),
                ride(orders.get(4), drivers.get(0), RideStatus.COMPLETED, "Thika Road hub", "Roysambu", "13.10", "1580.00", now.minusSeconds(88_000)),
                ride(orders.get(5), drivers.get(2), RideStatus.COMPLETED, "Karen store", "Langata", "5.80", "870.00", now.minusSeconds(128_000)),
                ride(orders.get(6), drivers.get(1), RideStatus.COMPLETED, "Westlands warehouse", "Parklands", "4.60", "760.00", now.minusSeconds(182_000)),
                ride(orders.get(8), null, RideStatus.CANCELLED, "CBD pickup", "Upper Hill", "3.90", null, now.minusSeconds(314_000)),
                ride(orders.get(10), drivers.get(2), RideStatus.ACCEPTED, "Mombasa Road hub", "Athi River", "18.50", "2140.00", now.minusSeconds(438_000)),
                ride(orders.get(11), drivers.get(0), RideStatus.COMPLETED, "Industrial Area", "Embakasi", "9.20", "1240.00", now.minusSeconds(514_000))
        ));
    }

    private Order order(AppUser customer, OrderStatus status, Instant createdAt, SeedLine... lines) {
        Order order = new Order()
                .setCustomer(customer)
                .setCustomerName(customer.getDisplayName())
                .setStatus(status)
                .setCurrency("KES")
                .setCreatedAt(createdAt);

        if (status == OrderStatus.CANCELLED) {
            order.setCancelledAt(createdAt.plusSeconds(900));
        }

        for (SeedLine line : lines) {
            order.addItem(OrderItem.from(line.product(), line.quantity()));
        }

        order.recalculateTotal();
        return order;
    }

    private Ride ride(
            Order order,
            AppUser driver,
            RideStatus status,
            String pickup,
            String dropoff,
            String distanceKm,
            String fareAmount,
            Instant requestedAt
    ) {
        Ride ride = new Ride()
                .setOrder(order)
                .setCustomer(order.getCustomer())
                .setDriver(driver)
                .setPickupLocation(pickup)
                .setDropoffLocation(dropoff)
                .setDistanceKm(new BigDecimal(distanceKm))
                .setStatus(status)
                .setRequestedAt(requestedAt);

        if (fareAmount != null) {
            ride.setFareAmount(new BigDecimal(fareAmount)).setCurrency("KES");
        }

        if (status == RideStatus.ACCEPTED || status == RideStatus.COMPLETED) {
            ride.setAcceptedAt(requestedAt.plusSeconds(1_200));
        }

        if (status == RideStatus.COMPLETED) {
            ride.setCompletedAt(requestedAt.plusSeconds(7_200));
        }

        if (status == RideStatus.CANCELLED) {
            ride.setCancelledAt(requestedAt.plusSeconds(1_800));
        }

        return ride;
    }

    private SeedLine line(Product product, int quantity) {
        return new SeedLine(product, quantity);
    }

    private record SeedLine(Product product, int quantity) {
    }
}
