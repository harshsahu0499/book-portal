package com.harsh.bookportal.controller;

import com.harsh.bookportal.entity.Progress;
import com.harsh.bookportal.entity.User;
import com.harsh.bookportal.repository.ProgressRepository;
import com.harsh.bookportal.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressRepository progressRepository;
    private final UserRepository userRepository;

    public ProgressController(ProgressRepository progressRepository, UserRepository userRepository) {
        this.progressRepository = progressRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/{bookId}")
    public ResponseEntity<Progress> getProgress(@PathVariable Long bookId, Authentication authentication) {
        User owner = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return progressRepository.findByBookIdAndOwner(bookId, owner)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping
    public Progress saveProgress(@RequestBody Progress progress, Authentication authentication) {
        User owner = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Progress existing = progressRepository.findByBookIdAndOwner(progress.getBookId(), owner)
                .orElse(new Progress());

        existing.setBookId(progress.getBookId());
        existing.setLastPage(progress.getLastPage());
        existing.setOwner(owner);

        return progressRepository.save(existing);
    }
}