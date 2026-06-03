// src/main/java/com/edtech/edtech_noticeboard/EdtechNoticeboardApplication.java
package com.edtech.edtech_noticeboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.edtech.edtech_noticeboard.entity")
@EnableJpaRepositories("com.edtech.edtech_noticeboard.repository")
public class EdtechNoticeboardApplication {
    public static void main(String[] args) {
        SpringApplication.run(EdtechNoticeboardApplication.class, args);
    }
}
