package com.pos.backend.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class Test {

    @GetMapping("/hello")
    public String getMethodName() {
        return "hello";
    }

}
