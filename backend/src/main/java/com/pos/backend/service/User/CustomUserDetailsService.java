package com.pos.backend.service.User;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import com.pos.backend.entity.User;
import com.pos.backend.repository.UserRepository;

@Configuration
public class CustomUserDetailsService {

    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return email -> {
            User user = userRepository.findByEmailWithRole(
                    email)
                    .orElseThrow(() -> new UsernameNotFoundException(email));

            return org.springframework.security.core.userdetails.User.builder()
                    .username(user.getEmail())
                    .password(user.getPasswordHash())
                    .authorities(user.getRole().getName())
                    .build();
        };
    }
}
