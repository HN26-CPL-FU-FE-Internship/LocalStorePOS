package com.pos.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Configuration;

import com.pos.backend.service.Init.BootstrapService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ApplicationInitConfig implements ApplicationRunner {

    BootstrapService bootstrapService;

    @Override
    public void run(ApplicationArguments args) throws Exception {

        bootstrapService.init();
    }

}
