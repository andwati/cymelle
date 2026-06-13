package com.andwati.orders.controller;

import com.andwati.orders.dto.request.AdminUserRequest;
import com.andwati.orders.dto.response.UserResponse;
import com.andwati.orders.services.AppUserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AppUserService appUserService;

    public UserController(AppUserService appUserService) {
        this.appUserService = appUserService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listUsers() {
        return appUserService.listUsers();
    }

    @GetMapping("/customers")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listCustomers() {
        return appUserService.listCustomers();
    }

    @GetMapping("/drivers")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listDrivers() {
        return appUserService.listDrivers();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createUser(@Valid @RequestBody AdminUserRequest request) {
        return appUserService.createUser(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUser(@PathVariable UUID id, @Valid @RequestBody AdminUserRequest request) {
        return appUserService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse disableUser(@PathVariable UUID id) {
        return appUserService.disableUser(id);
    }
}
