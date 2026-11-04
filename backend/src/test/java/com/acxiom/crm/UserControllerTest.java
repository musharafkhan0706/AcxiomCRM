package com.acxiom.crm;

import com.acxiom.crm.controller.UserController;
import com.acxiom.crm.dto.*;
import com.acxiom.crm.entity.Role;
import com.acxiom.crm.entity.RoleName;
import com.acxiom.crm.entity.User;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.AuthService;
import com.acxiom.crm.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private AuthService authService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private UserController userController;

    private UserPrincipal adminPrincipal;
    private UserResponse testUserResponse;

    @BeforeEach
    void setUp() {
        Role adminRole = new Role(RoleName.ADMIN, "Administrator role");
        User adminUser = new User("Alexander Wright", "admin@acxiomcrm.com", "hash", adminRole, "IT");
        adminUser.setId(1L);
        adminPrincipal = UserPrincipal.create(adminUser);

        testUserResponse = new UserResponse();
        testUserResponse.setId(2L);
        testUserResponse.setName("Sarah Jenkins");
        testUserResponse.setEmail("sarah@acxiomcrm.com");
        testUserResponse.setRole(RoleName.SALES_EXECUTIVE);
        testUserResponse.setDepartment("Enterprise Sales");
        testUserResponse.setActive(true);
        testUserResponse.setLocked(false);
        testUserResponse.setFailedLoginCount(0);
        testUserResponse.setCreatedAt(Instant.now());
    }

    @Test
    @DisplayName("getUsers should return paged user response")
    void testGetUsers() {
        PagedResponse<UserResponse> pagedResponse = new PagedResponse<>(
                Collections.singletonList(testUserResponse),
                0, 10, 1L, 1, true
        );
        when(userService.searchUsers(any(), any(), any(), any(Pageable.class))).thenReturn(pagedResponse);

        ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> response =
                userController.getUsers(null, null, null, PageRequest.of(0, 10));

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().getContent().size());
        verify(userService, times(1)).searchUsers(any(), any(), any(), any(Pageable.class));
    }

    @Test
    @DisplayName("getAssignableUsers should return active users")
    void testGetAssignableUsers() {
        when(userService.getAssignableUsers()).thenReturn(Collections.singletonList(testUserResponse));

        ResponseEntity<ApiResponse<List<UserResponse>>> response = userController.getAssignableUsers();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getData().size());
        verify(userService, times(1)).getAssignableUsers();
    }

    @Test
    @DisplayName("getUserById should return user response")
    void testGetUserById() {
        when(userService.getUserById(2L)).thenReturn(testUserResponse);

        ResponseEntity<ApiResponse<UserResponse>> response = userController.getUserById(2L);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Sarah Jenkins", response.getBody().getData().getName());
        verify(userService, times(1)).getUserById(2L);
    }

    @Test
    @DisplayName("createUser should return 201 Created and new user")
    void testCreateUser() {
        UserRequest request = new UserRequest();
        request.setName("John Doe");
        request.setEmail("john@acxiomcrm.com");
        request.setPassword("Secret@123");
        request.setRole(RoleName.MANAGER);
        request.setDepartment("Sales");
        request.setActive(true);

        when(userService.createUser(eq(request), eq(adminPrincipal))).thenReturn(testUserResponse);

        ResponseEntity<ApiResponse<UserResponse>> response = userController.createUser(request, adminPrincipal);

        assertNotNull(response);
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        verify(userService, times(1)).createUser(eq(request), eq(adminPrincipal));
    }

    @Test
    @DisplayName("updateUser should update and return user")
    void testUpdateUser() {
        UserRequest request = new UserRequest();
        request.setName("John Updated");
        request.setEmail("john@acxiomcrm.com");
        request.setRole(RoleName.MANAGER);
        request.setDepartment("Sales");
        request.setActive(true);

        when(userService.updateUser(eq(2L), eq(request), eq(adminPrincipal))).thenReturn(testUserResponse);

        ResponseEntity<ApiResponse<UserResponse>> response = userController.updateUser(2L, request, adminPrincipal);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService, times(1)).updateUser(eq(2L), eq(request), eq(adminPrincipal));
    }

    @Test
    @DisplayName("updateUserRole should change role and return updated user")
    void testUpdateUserRole() {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(RoleName.MANAGER);
        when(userService.updateUserRole(eq(2L), eq(request), eq(adminPrincipal))).thenReturn(testUserResponse);

        ResponseEntity<ApiResponse<UserResponse>> response = userController.updateUserRole(2L, request, adminPrincipal);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService, times(1)).updateUserRole(eq(2L), eq(request), eq(adminPrincipal));
    }

    @Test
    @DisplayName("toggleUserActive with boolean parameter should call setUserActive")
    void testToggleUserActiveWithParam() {
        when(userService.setUserActive(eq(2L), eq(false), eq(adminPrincipal))).thenReturn(testUserResponse);

        ResponseEntity<ApiResponse<UserResponse>> response = userController.toggleUserActive(2L, false, adminPrincipal);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService, times(1)).setUserActive(eq(2L), eq(false), eq(adminPrincipal));
    }

    @Test
    @DisplayName("toggleUserActive without boolean parameter should call toggleUserActive")
    void testToggleUserActiveWithoutParam() {
        when(userService.toggleUserActive(eq(2L), eq(adminPrincipal))).thenReturn(testUserResponse);

        ResponseEntity<ApiResponse<UserResponse>> response = userController.toggleUserActive(2L, null, adminPrincipal);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService, times(1)).toggleUserActive(eq(2L), eq(adminPrincipal));
    }

    @Test
    @DisplayName("unlockUser should unlock account and return user")
    void testUnlockUser() {
        when(userService.unlockUser(eq(2L), eq(adminPrincipal))).thenReturn(testUserResponse);

        ResponseEntity<ApiResponse<UserResponse>> response = userController.unlockUser(2L, adminPrincipal);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(userService, times(1)).unlockUser(eq(2L), eq(adminPrincipal));
    }

    @Test
    @DisplayName("resetPassword should invoke authService and return success")
    void testResetPassword() {
        ResetPasswordRequest request = new ResetPasswordRequest("NewPass@2026!");
        doNothing().when(authService).resetPassword(eq(2L), eq(request), eq(adminPrincipal), any());

        ResponseEntity<ApiResponse<String>> response = userController.resetPassword(2L, request, adminPrincipal, httpRequest);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        verify(authService, times(1)).resetPassword(eq(2L), eq(request), eq(adminPrincipal), any());
    }
}
