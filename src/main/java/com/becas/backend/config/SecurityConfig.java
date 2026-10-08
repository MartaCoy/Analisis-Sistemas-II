package com.becas.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter() {
        return new JwtAuthFilter();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
            Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList()
        );

        configuration.setAllowedMethods(
            List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );

        configuration.setAllowedHeaders(
            List.of("Authorization", "Content-Type", "Accept")
        );

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/api/**", configuration);

        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtAuthFilter jwtAuthFilter,
            CorsConfigurationSource corsConfigurationSource
    ) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
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
                .requestMatchers("/api/panel-evaluador/**").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.GET, "/api/reportes/**").hasRole("ADMINISTRADOR")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
