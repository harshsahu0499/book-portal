package com.harsh.bookportal.repository;

import com.harsh.bookportal.entity.Progress;
import com.harsh.bookportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProgressRepository extends JpaRepository<Progress, Long> {
    Optional<Progress> findByBookId(Long bookId);
    Optional<Progress> findByBookIdAndOwner(Long bookId, User owner);
}