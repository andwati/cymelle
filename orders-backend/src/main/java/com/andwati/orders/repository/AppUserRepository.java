package com.andwati.orders.repository;

import com.andwati.orders.model.AppUser;
import com.andwati.orders.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByRole(Role role);

    List<AppUser> findByRoleOrderByCreatedAtDesc(Role role);

    List<AppUser> findAllByOrderByCreatedAtDesc();
}
