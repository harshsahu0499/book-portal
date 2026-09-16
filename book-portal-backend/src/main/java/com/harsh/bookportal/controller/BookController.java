package com.harsh.bookportal.controller;

import com.harsh.bookportal.entity.Book;
import com.harsh.bookportal.entity.User;
import com.harsh.bookportal.repository.BookRepository;
import com.harsh.bookportal.repository.UserRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/books")
public class BookController {
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Value("${book.storage.path}")
    private String storagePath;

    public BookController(BookRepository bookRepository, UserRepository userRepository){
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Book> getAllBooks(Authentication authentication){
        String usrename = authentication.getName();
        User owner = userRepository.findByUsername(usrename)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookRepository.findByOwner(owner);
    }

    @PostMapping("/upload")
    public Book uploadBook(@RequestParam("file")MultipartFile file, Authentication authentication) throws IOException{
        String username = authentication.getName();
        User owner = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));

        String storedFilename = UUID.randomUUID() + ".pdf";
        Path destination = Path.of(storagePath, storedFilename);

        Files.createDirectories(destination.getParent());
        file.transferTo(destination);

        Book book = new Book();
        book.setTitle(file.getOriginalFilename());
        book.setFilename(storedFilename);
        book.setFilepath(destination.toString());
        book.setOwner(owner);

        // extract page count
        try (PDDocument document = Loader.loadPDF(destination.toFile())){
            book.setTotalPages(document.getNumberOfPages());
        }
        return bookRepository.save(book);
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> getBookFile(@PathVariable Long id, Authentication authentication) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        if (!book.getOwner().getUsername().equals(authentication.getName())) {
            return ResponseEntity.status(403).build();
        }

        Resource file = new FileSystemResource(book.getFilepath());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + book.getFilename() + "\"")
                .body(file);
    }
}
