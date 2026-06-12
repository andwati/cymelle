package com.andwati.orders.repository;

import com.andwati.orders.model.InventoryItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {

    @Query("""
            select inventory
            from InventoryItem inventory
            join fetch inventory.product product
            order by product.name asc
            """)
    List<InventoryItem> findAllWithProducts();

    @Query("""
            select inventory
            from InventoryItem inventory
            join fetch inventory.product product
            where inventory.availableQuantity < :threshold
            order by inventory.availableQuantity asc, product.name asc
            """)
    List<InventoryItem> findLowStockItems(@Param("threshold") int threshold);

    Optional<InventoryItem> findByProduct_Id(UUID productId);

    List<InventoryItem> findByProduct_IdIn(Collection<UUID> productIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select inventory
            from InventoryItem inventory
            join fetch inventory.product product
            where product.id in :productIds
            """)
    List<InventoryItem> findByProductIdsForUpdate(@Param("productIds") Collection<UUID> productIds);
}