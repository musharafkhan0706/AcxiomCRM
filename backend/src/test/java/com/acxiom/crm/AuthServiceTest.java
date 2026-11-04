package com.acxiom.crm;

import com.acxiom.crm.audit.AuditService;
import com.acxiom.crm.dto.AuthResponse;
import com.acxiom.crm.dto.LoginRequest;
import com.acxiom.crm.entity.Role;
import com.acxiom.crm.entity.RoleName;
import com.acxiom.crm.entity.User;
import com.acxiom.crm.exception.AccountLockedException;
import com.acxiom.crm.repository.RefreshTokenRepository;
import com.acxiom.crm.repository.RoleRepository;
import com.acxiom.crm.repository.UserRepository;
import com.acxiom.crm.security.JwtTokenProvider;
import com.acxiom.crm.security.UserPrincipal;
import com.acxiom.crm.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private Role sampleRole;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "maxFailedAttempts", 5);
        ReflectionTestUtils.setField(authService, "lockoutDurationMinutes", 15);
        ReflectionTestUtils.setField(authService, "refreshExpirationMs", 604800000L);

        sampleRole = new Role(RoleName.ADMIN, "Admin Role");
        sampleUser = new User("Alexander Wright", "admin@acxiomcrm.com", "hashedPassword", sampleRole, "Exec");
        sampleUser.setId(1L);
    }

    @Test
    @DisplayName("Should successfully authenticate valid user and return tokens")
    void testSuccessfulLogin() {
        LoginRequest request = new LoginRequest("admin@acxiomcrm.com", "Admin@Acxiom2026!");

        when(userRepository.findByEmailIgnoreCase("admin@acxiomcrm.com")).thenReturn(Optional.of(sampleUser));

        UserPrincipal principal = UserPrincipal.create(sampleUser);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(tokenProvider.generateAccessToken(any())).thenReturn("sample.access.jwt");
        when(tokenProvider.getExpirationMs()).thenReturn(900000L);

        AuthResponse response = authService.login(request, null);

        assertNotNull(response);
        assertEquals("sample.access.jwt", response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertEquals("admin@acxiomcrm.com", response.getEmail());
        assertEquals(RoleName.ADMIN, response.getRole());
        assertEquals(0, sampleUser.getFailedLoginCount());
    }

    @Test
    @DisplayName("Should increment failed attempts on invalid credentials")
    void testFailedLoginIncrementsCount() {
        LoginRequest request = new LoginRequest("admin@acxiomcrm.com", "WrongPassword");

        when(userRepository.findByEmailIgnoreCase("admin@acxiomcrm.com")).thenReturn(Optional.of(sampleUser));
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(BadCredentialsException.class, () -> authService.login(request, null));

        assertEquals(1, sampleUser.getFailedLoginCount());
        assertFalse(sampleUser.isLocked());
    }

    @Test
    @DisplayName("Should lock account when failed login attempts reach threshold")
    void testAccountLockoutThreshold() {
        LoginRequest request = new LoginRequest("admin@acxiomcrm.com", "WrongPassword");
        sampleUser.setFailedLoginCount(4); // 4th attempt already recorded

        when(userRepository.findByEmailIgnoreCase("admin@acxiomcrm.com")).thenReturn(Optional.of(sampleUser));
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        assertThrows(AccountLockedException.class, () -> authService.login(request, null));

        assertEquals(5, sampleUser.getFailedLoginCount());
        assertTrue(sampleUser.isLocked());
        assertNotNull(sampleUser.getLockoutTime());
    }
}

