package com.andwati.orders.services;

import com.andwati.orders.dto.request.ProductRequest;
import com.andwati.orders.dto.response.ProductResponse;
import com.andwati.orders.exception.ProductNotFoundException;
import com.andwati.orders.mappers.ProductMapper;
import com.andwati.orders.model.InventoryItem;
import com.andwati.orders.model.Product;
import com.andwati.orders.model.Role;
import com.andwati.orders.repository.InventoryItemRepository;
import com.andwati.orders.repository.ProductRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final ProductMapper productMapper;
    private final AppUserService appUserService;

    public ProductService(
            ProductRepository productRepository,
            InventoryItemRepository inventoryItemRepository,
            ProductMapper productMapper,
            AppUserService appUserService
    ) {
        this.productRepository = productRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.productMapper = productMapper;
        this.appUserService = appUserService;
    }

    @Transactional(readOnly = true)
    public java.util.List<ProductResponse> listProducts() {
        Role role = currentRoleOrCustomer();
        var products = productRepository.findAll(Sort.by("name"));
        var inventoriesByProductId = inventoryItemRepository.findByProduct_IdIn(
                        products.stream().map(Product::getId).toList()
                )
                .stream()
                .collect(Collectors.toMap(item -> item.getProduct().getId(), Function.identity()));

        return products.stream()
                .filter(product -> role == Role.ADMIN || product.isActive())
                .map(product -> productMapper.toResponse(product, inventoriesByProductId.get(product.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProduct(UUID id) {
        Product product = getProductOrThrow(id);

        if (!product.isActive() && currentRoleOrCustomer() != Role.ADMIN) {
            throw new ProductNotFoundException(id);
        }

        InventoryItem inventoryItem = inventoryItemRepository.findByProduct_Id(id).orElse(null);
        return productMapper.toResponse(product, inventoryItem);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product product = new Product()
                .setName(request.name().trim())
                .setSku(request.sku().trim())
                .setPrice(request.price())
                .setCurrency(request.currency().trim().toUpperCase())
                .setActive(request.active())
                .setCreatedAt(Instant.now())
                .setUpdatedAt(Instant.now());

        Product savedProduct = productRepository.save(product);

        InventoryItem inventoryItem = new InventoryItem()
                .setProduct(savedProduct)
                .setAvailableQuantity(request.availableQuantity())
                .setReservedQuantity(0)
                .setReorderLevel(request.reorderLevel())
                .setUpdatedAt(Instant.now());

        inventoryItemRepository.save(inventoryItem);

        return productMapper.toResponse(savedProduct, inventoryItem);
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, ProductRequest request) {
        Product product = getProductOrThrow(id)
                .setName(request.name().trim())
                .setSku(request.sku().trim())
                .setPrice(request.price())
                .setCurrency(request.currency().trim().toUpperCase())
                .setActive(request.active());

        InventoryItem inventoryItem = inventoryItemRepository.findByProduct_Id(id)
                .orElseGet(() -> new InventoryItem()
                        .setProduct(product)
                        .setReservedQuantity(0)
                );

        inventoryItem
                .setAvailableQuantity(request.availableQuantity())
                .setReorderLevel(request.reorderLevel())
                .setUpdatedAt(Instant.now());

        inventoryItemRepository.save(inventoryItem);

        return productMapper.toResponse(product, inventoryItem);
    }

    @Transactional
    public ProductResponse deactivateProduct(UUID id) {
        Product product = getProductOrThrow(id).setActive(false);
        InventoryItem inventoryItem = inventoryItemRepository.findByProduct_Id(id).orElse(null);
        return productMapper.toResponse(product, inventoryItem);
    }

    public Product getProductOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    private Role currentRoleOrCustomer() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return Role.CUSTOMER;
        }

        return appUserService.getCurrentUser().getRole();
    }
}
