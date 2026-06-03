package com.edtech.edtech_backend.service;

import com.edtech.edtech_backend.entity.CourseEngagementAnalytics;
import com.edtech.edtech_backend.repository.CourseEngagementAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CourseEngagementAnalyticsService {
    private final CourseEngagementAnalyticsRepository repo;

    public CourseEngagementAnalytics save(CourseEngagementAnalytics data) {
        return repo.save(data);
    }
}
