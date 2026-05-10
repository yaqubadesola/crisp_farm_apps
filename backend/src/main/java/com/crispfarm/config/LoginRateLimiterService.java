package com.crispfarm.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP rate limiter for the login endpoint.
 * Allows 5 attempts per minute per IP address.
 * Buckets are cleaned up hourly to prevent unbounded memory growth.
 */
@Service
@Slf4j
public class LoginRateLimiterService {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Returns true if the request is allowed, false if rate limit is exceeded.
     */
    public boolean tryConsume(String ip) {
        return buckets.computeIfAbsent(ip, this::newBucket).tryConsume(1);
    }

    private Bucket newBucket(String ip) {
        Bandwidth limit = Bandwidth.classic(MAX_ATTEMPTS, Refill.intervally(MAX_ATTEMPTS, WINDOW));
        return Bucket.builder().addLimit(limit).build();
    }

    /** Clears all buckets every hour so memory doesn't grow for long-idle IPs. */
    @Scheduled(fixedRate = 3_600_000)
    public void cleanup() {
        int size = buckets.size();
        buckets.clear();
        if (size > 0) log.debug("Rate limiter: cleared {} IP bucket(s)", size);
    }
}
