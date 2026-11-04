package com.acxiom.crm.repository;

import com.acxiom.crm.entity.RoleName;
import com.acxiom.crm.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT u FROM User u WHERE " +
           "(:query IS NULL OR :query = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:roleName IS NULL OR u.role.name = :roleName) AND " +
           "(:isActive IS NULL OR u.isActive = :isActive)")
    Page<User> searchUsers(@Param("query") String query,
                           @Param("roleName") RoleName roleName,
                           @Param("isActive") Boolean isActive,
                           Pageable pageable);

    List<User> findByRoleName(RoleName roleName);

    List<User> findByDepartment(String department);
}

