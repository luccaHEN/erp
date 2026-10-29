package com.erpflow.user.repository;

import com.erpflow.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u JOIN FETCH u.company WHERE u.email = :email")
    Optional<User> findByEmailWithCompany(@Param("email") String email);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByCompanyId(Long companyId);

    Optional<User> findByIdAndCompanyId(Long id, Long companyId);
}
