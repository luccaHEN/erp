package com.erpflow.user.service;

import com.erpflow.company.domain.Company;
import com.erpflow.company.repository.CompanyRepository;
import com.erpflow.shared.exception.BusinessException;
import com.erpflow.shared.exception.ResourceNotFoundException;
import com.erpflow.shared.security.TenantContext;
import com.erpflow.user.domain.Role;
import com.erpflow.user.domain.User;
import com.erpflow.user.dto.UserCreateRequest;
import com.erpflow.user.dto.UserResponse;
import com.erpflow.user.dto.UserUpdateRequest;
import com.erpflow.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       CompanyRepository companyRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findAllByCurrentCompany() {
        Long companyId = TenantContext.getCurrentCompanyId();
        return userRepository.findByCompanyId(companyId).stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        User user = userRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", id));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse create(UserCreateRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Já existe um usuário cadastrado com o e-mail: " + request.getEmail());
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", companyId));

        User user = new User();
        user.setCompany(company);
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(true);

        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request) {
        Long companyId = TenantContext.getCurrentCompanyId();
        User user = userRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", id));

        // Unicidade de e-mail se alterado
        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Já existe um usuário cadastrado com o e-mail: " + request.getEmail());
        }

        // Impedir que o usuário atual desative a si próprio ou retire seu perfil de ADMIN se for o único
        Long currentUserId = TenantContext.getCurrentUserId();
        if (user.getId().equals(currentUserId)) {
            if (!request.isActive()) {
                throw new BusinessException("Não é permitido desativar o próprio usuário logado.");
            }
            if (request.getRole() != Role.ADMIN) {
                throw new BusinessException("Você não pode remover seu próprio papel de Administrador.");
            }
        }

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());
        user.setActive(request.isActive());

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
        }

        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserResponse toggleStatus(Long id) {
        Long companyId = TenantContext.getCurrentCompanyId();
        Long currentUserId = TenantContext.getCurrentUserId();

        if (id.equals(currentUserId)) {
            throw new BusinessException("Não é permitido desativar o próprio usuário logado.");
        }

        User user = userRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", id));

        user.setActive(!user.isActive());
        return UserResponse.fromEntity(userRepository.save(user));
    }
}
