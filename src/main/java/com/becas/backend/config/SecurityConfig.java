package com.becas.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()

                // Convocatorias: crear/publicar/cerrar solo ADMIN, cualquiera logueado
                .requestMatchers(HttpMethod.POST, "/api/convocatorias").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.PUT, "/api/convocatorias/**").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.PUT, "/api/solicitudes/*/evaluar", "/api/solicitudes/*/aprobar", "/api/solicitudes/*/rechazar").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.GET, "/api/convocatorias/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/comites/**").hasRole("ADMINISTRADOR")
                .requestMatchers(HttpMethod.PUT, "/api/solicitudes/*/asignar/**").hasRole("ADMINISTRADOR")
               // .requestMatchers(HttpMethod.POST, "/api/comites/**").hasRole("ADMINISTRADOR")
               // .requestMatchers(HttpMethod.GET, "/api/comites/**").hasAnyRole("ADMINISTRADOR", "ESTUDIANTE")

                // Estudiantes: listar todos, solo ADMIn
                .requestMatchers(HttpMethod.GET, "/api/estudiantes").hasRole("ADMINISTRADOR")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}