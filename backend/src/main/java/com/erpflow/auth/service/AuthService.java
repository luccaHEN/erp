package com.erpflow.auth.service;

import com.erpflow.auth.dto.LoginRequest;
import com.erpflow.auth.dto.LoginResponse;
import com.erpflow.auth.dto.UserProfileResponse;
import com.erpflow.shared.exception.ResourceNotFoundException;
import com.erpflow.shared.security.JwtService;
import com.erpflow.shared.security.UserPrincipal;
import com.erpflow.user.domain.User;
import com.erpflow.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${app.jwt.expiration-hours:24}")
    private long expirationHours;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtService.generateToken(principal);
        long expiresInSeconds = expirationHours * 3600;

        UserProfileResponse userProfile = new UserProfileResponse(
                principal.getId(),
                principal.getName(),
                principal.getUsername(),
                principal.getRole(),
                principal.getCompanyId(),
                principal.getCompanyName()
        );

        return new LoginResponse(token, expiresInSeconds, userProfile);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new ResourceNotFoundException("Nenhum usuário autenticado encontrado na sessão atual");
        }

        User user = userRepository.findByEmailWithCompany(principal.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", principal.getUsername()));

        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCompany().getId(),
                user.getCompany().getTradeName()
        );
    }
}
