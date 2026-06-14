package com.andwati.orders;

import com.andwati.orders.config.FareProperties;
import com.andwati.orders.config.InventoryProperties;
import com.andwati.orders.config.PaystackProperties;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
        FareProperties.class,
        InventoryProperties.class,
        PaystackProperties.class
})
public class OrdersBackendApplication {

    public static void main(String[] args) {

        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().systemProperties().load();

        SpringApplication.run(OrdersBackendApplication.class, args);
    }

}
