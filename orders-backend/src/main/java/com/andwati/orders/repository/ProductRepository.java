package com.andwati.orders.repository;

import com.andwati.orders.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByIdIn(Collection<UUID> ids);

    Optional<Product> findBySkuIgnoreCase(String sku);
}
