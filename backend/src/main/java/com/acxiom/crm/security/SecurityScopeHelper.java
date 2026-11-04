package com.acxiom.crm.security;

import com.acxiom.crm.entity.RoleName;
import com.acxiom.crm.entity.User;
import com.acxiom.crm.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class SecurityScopeHelper {

    private final UserRepository userRepository;

    public SecurityScopeHelper(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Returns a collection of user IDs that the current authenticated user has access to.
     * Returns null if user is ADMIN (unrestricted global access).
     */
    public Collection<Long> getScopedUserIds(UserPrincipal currentUser) {
        if (currentUser == null || currentUser.getRole() == RoleName.ADMIN) {
            return null; // No scope limitation
        }

        if (currentUser.getRole() == RoleName.MANAGER) {
            Set<Long> teamUserIds = new HashSet<>();
            teamUserIds.add(currentUser.getId());

            String dept = currentUser.getDepartment();
            if (dept != null && !dept.isBlank()) {
                teamUserIds.addAll(
                        userRepository.findByDepartment(dept).stream()
                                .map(User::getId)
                                .collect(Collectors.toSet())
                );
            }
            // Also include sales executives
            teamUserIds.addAll(
                    userRepository.findByRoleName(RoleName.SALES_EXECUTIVE).stream()
                            .map(User::getId)
                            .collect(Collectors.toSet())
            );
            return teamUserIds;
        }

        // SALES_EXECUTIVE: strictly personal scope
        return Collections.singletonList(currentUser.getId());
    }

    public boolean canAccessRecord(UserPrincipal currentUser, Long assignedUserId, Long createdByUserId) {
        if (currentUser == null || currentUser.getRole() == RoleName.ADMIN) {
            return true;
        }

        Collection<Long> scopedIds = getScopedUserIds(currentUser);
        if (scopedIds == null) {
            return true;
        }

        if (assignedUserId != null && scopedIds.contains(assignedUserId)) {
            return true;
        }

        return createdByUserId != null && scopedIds.contains(createdByUserId);
    }
}

