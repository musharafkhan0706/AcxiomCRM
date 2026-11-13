package com.acxiom.crm.repository;

import com.acxiom.crm.entity.Customer;
import com.acxiom.crm.entity.CustomerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByCustomerCode(String customerCode);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);

    @Query("SELECT c FROM Customer c WHERE " +
           "(:scopedUserIds IS NULL OR c.assignedTo.id IN :scopedUserIds OR c.createdBy.id IN :scopedUserIds) AND " +
           "c.status = :status ORDER BY c.customerName ASC")
    List<Customer> findAccessibleCustomersByStatus(@Param("scopedUserIds") Collection<Long> scopedUserIds,
                                                   @Param("status") CustomerStatus status);

    @Query("SELECT c FROM Customer c WHERE " +
           "(:scopedUserIds IS NULL OR c.assignedTo.id IN :scopedUserIds OR c.createdBy.id IN :scopedUserIds) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(c.customerName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.phone) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Customer> searchCustomers(@Param("query") String query,
                                   @Param("status") CustomerStatus status,
                                   @Param("scopedUserIds") Collection<Long> scopedUserIds,
                                   Pageable pageable);

    @Query("SELECT COUNT(c) FROM Customer c WHERE " +
           "(:scopedUserIds IS NULL OR c.assignedTo.id IN :scopedUserIds OR c.createdBy.id IN :scopedUserIds) AND " +
           "(:startDate IS NULL OR c.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR c.createdAt <= :endDate)")
    long countWithFilters(@Param("scopedUserIds") Collection<Long> scopedUserIds,
                          @Param("startDate") Instant startDate,
                          @Param("endDate") Instant endDate);

    Optional<Customer> findTopByOrderByIdDesc();
}

