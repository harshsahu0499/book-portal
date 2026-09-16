package com.harsh.bookportal.repository;

import com.harsh.bookportal.entity.Book;
import com.harsh.bookportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByOwner(User user);
}
