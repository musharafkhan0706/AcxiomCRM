package com.acxiom.crm.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_AUTH_REQUESTS_PER_MINUTE = 15;
    private static final int MAX_REFRESH_REQUESTS_PER_MINUTE = 30;
    private static final long WINDOW_MILLIS = 60_000L; // 1 minute

    private final Map<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        if (isRateLimitedEndpoint(path)) {
            String clientIp = extractClientIp(request);
            String bucketKey = path + ":" + clientIp;
            int limit = path.contains("/refresh") ? MAX_REFRESH_REQUESTS_PER_MINUTE : MAX_AUTH_REQUESTS_PER_MINUTE;

            long now = System.currentTimeMillis();
            Deque<Long> timestamps = requestLog.computeIfAbsent(bucketKey, k -> new ConcurrentLinkedDeque<>());

            synchronized (timestamps) {
                // Evict timestamps older than 1 minute
                while (!timestamps.isEmpty() && (now - timestamps.peekFirst()) > WINDOW_MILLIS) {
                    timestamps.pollFirst();
                }

                if (timestamps.size() >= limit) {
                    long oldestInWindow = timestamps.peekFirst() != null ? timestamps.peekFirst() : now;
                    long retryAfterSec = Math.max(1, (WINDOW_MILLIS - (now - oldestInWindow)) / 1000);

                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setHeader("Retry-After", String.valueOf(retryAfterSec));

                    Map<String, Object> errorBody = new LinkedHashMap<>();
                    errorBody.put("success", false);
                    errorBody.put("message", "Too many requests. Rate limit exceeded. Please wait " + retryAfterSec + " seconds before retrying.");
                    errorBody.put("retryAfterSeconds", retryAfterSec);
                    errorBody.put("timestamp", Instant.now().toString());

                    response.getWriter().write(objectMapper.writeValueAsString(errorBody));
                    return;
                }

                timestamps.addLast(now);
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimitedEndpoint(String path) {
        return path != null && (
                path.equals("/api/auth/login") ||
                path.equals("/api/auth/forgot-password") ||
                path.equals("/api/auth/reset-password") ||
                path.equals("/api/auth/refresh")
        );
    }

    private String extractClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "unknown";
    }
}
