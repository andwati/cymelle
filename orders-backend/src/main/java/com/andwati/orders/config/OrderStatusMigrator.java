package com.andwati.orders.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class OrderStatusMigrator implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public OrderStatusMigrator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.update("alter table orders drop constraint if exists orders_status_check");
            jdbcTemplate.update("update orders set status = 'PENDING' where status = 'PLACED'");
        } catch (RuntimeException ignored) {
            // The table may not exist yet during first boot with hibernate ddl-auto=update.
        }
    }
}
