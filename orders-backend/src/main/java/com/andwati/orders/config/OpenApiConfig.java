package com.andwati.orders.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI orderFareOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Order Management + Fare Engine API")
                        .description("""
                                API for managing orders, inventory stock levels, order cancellation rollback,
                                and fare calculation.
                                
                                Core features:
                                - Place orders and deduct stock
                                - Cancel orders and roll back stock
                                - View inventory and low-stock items
                                - Calculate trip fares using base fare, per-km rate, surge multiplier, and minimum fare
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Ian Andwati")
                                .email("andwatiian@gmail.com"))
                        .license(new License()
                                .name("MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080")
                                .description("Local development server")
                ))
                .externalDocs(new ExternalDocumentation()
                        .description("Project Repository")
                        .url("https://github.com/andwati/cymelle"));
    }
}