package com.acxiom.crm.scheduler;

import com.acxiom.crm.repository.FollowUpRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class FollowUpScheduler {

    private static final Logger logger = LoggerFactory.getLogger(FollowUpScheduler.class);

    private final FollowUpRepository followUpRepository;

    public FollowUpScheduler(FollowUpRepository followUpRepository) {
        this.followUpRepository = followUpRepository;
    }

    /**
     * Check periodically every 15 minutes for overdue follow-ups
     */
    @Scheduled(fixedRate = 900000)
    public void scanOverdueFollowUps() {
        try {
            long overdueCount = followUpRepository.countOverdue(Instant.now(), null);
            if (overdueCount > 0) {
                logger.info("[Scheduler] Alert: {} active follow-up task(s) are currently overdue.", overdueCount);
            }
        } catch (Exception e) {
            logger.warn("[Scheduler] Exception scanning overdue follow-ups: {}", e.getMessage());
        }
    }
}
