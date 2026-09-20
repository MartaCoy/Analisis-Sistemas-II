package com.becas.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter() {
        return new JwtAuthFilter();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/convocatorias").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.PUT, "/api/convocatorias/**").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.PUT, "/api/solicitudes/*/evaluar", "/api/solicitudes/*/aprobar", "/api/solicitudes/*/rechazar").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.GET, "/api/convocatorias/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/comites/**").hasAnyAuthority("ADMINISTRADOR", "ROLE_ADMINISTRADOR")
                .requestMatchers(HttpMethod.POST, "/api/comites").hasAnyAuthority("ADMINISTRADOR", "ROLE_ADMINISTRADOR")
                .requestMatchers(HttpMethod.GET, "/api/comites/**").hasAnyAuthority("ADMINISTRADOR", "ROLE_ADMINISTRADOR", "ESTUDIANTE", "ROLE_ESTUDIANTE")
                .requestMatchers(HttpMethod.PUT, "/api/solicitudes/*/asignar/**").hasAnyAuthority("ADMINISTRADOR", "ROLE_ADMINISTRADOR")
                .requestMatchers(HttpMethod.GET, "/api/estudiantes").hasAnyAuthority("ADMINISTRADOR", "ROLE_ADMINISTRADOR")
                .requestMatchers(HttpMethod.POST, "/api/solicitudes/*/evaluaciones").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.GET, "/api/solicitudes/*/evaluaciones").hasRole("ADMINISTRADOR")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}