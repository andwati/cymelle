package com.andwati.orders.services;

import com.andwati.orders.dto.request.AdminUserRequest;
import com.andwati.orders.dto.request.RegisterRequest;
import com.andwati.orders.dto.response.AuthUserResponse;
import com.andwati.orders.dto.response.UserResponse;
import com.andwati.orders.model.AppUser;
import com.andwati.orders.model.Role;
import com.andwati.orders.repository.AppUserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AppUserService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AppUserService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthUserResponse registerCustomer(RegisterRequest request) {
        String username = normalizeUsername(request.username());

        if (appUserRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Username is already taken");
        }

        AppUser user = new AppUser()
                .setUsername(username)
                .setDisplayName(request.displayName().trim())
                .setPasswordHash(passwordEncoder.encode(request.password()))
                .setRole(Role.CUSTOMER)
                .setEnabled(true);

        return toResponse(appUserRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AppUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Authentication is required");
        }

        return appUserRepository.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user was not found"));
    }

    public AuthUserResponse toResponse(AppUser user) {
        return new AuthUserResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getRole()
        );
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return appUserRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listCustomers() {
        return appUserRepository.findByRoleOrderByCreatedAtDesc(Role.CUSTOMER)
                .stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listDrivers() {
        return appUserRepository.findByRoleOrderByCreatedAtDesc(Role.DRIVER)
                .stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Transactional
    public UserResponse createUser(AdminUserRequest request) {
        String username = normalizeUsername(request.username());

        if (appUserRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Username is already taken");
        }

        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("password is required");
        }

        AppUser user = new AppUser()
                .setUsername(username)
                .setDisplayName(request.displayName().trim())
                .setPasswordHash(passwordEncoder.encode(request.password()))
                .setRole(request.role())
                .setEnabled(request.enabled());

        return toUserResponse(appUserRepository.save(user));
    }

    @Transactional
    public UserResponse updateUser(UUID id, AdminUserRequest request) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User was not found"));
        String username = normalizeUsername(request.username());

        appUserRepository.findByUsernameIgnoreCase(username)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Username is already taken");
                });

        user.setUsername(username)
                .setDisplayName(request.displayName().trim())
                .setRole(request.role())
                .setEnabled(request.enabled());

        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        return toUserResponse(user);
    }

    @Transactional
    public UserResponse disableUser(UUID id) {
        AppUser user = appUserRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User was not found"));
        user.setEnabled(false);
        return toUserResponse(user);
    }

    private UserResponse toUserResponse(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getRole(),
                user.isEnabled(),
                user.getCreatedAt()
        );
    }

    public String normalizeUsername(String username) {
        return username.trim().toLowerCase();
    }
}
