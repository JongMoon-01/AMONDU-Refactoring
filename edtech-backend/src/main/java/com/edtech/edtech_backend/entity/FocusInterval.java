// FocusInterval.java
package com.edtech.edtech_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter @Setter
@Embeddable
public class FocusInterval {
    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Column(name = "duration_sec")
    private Integer durationSec;

    @Column(name = "avg_score")
    private Double avgScore;
}
