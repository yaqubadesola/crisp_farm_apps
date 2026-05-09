package com.crispfarm.modules.customer;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.modules.customer.dto.CreateCustomerTypeRequest;
import com.crispfarm.modules.customer.dto.CustomerTypeDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customer-types")
@RequiredArgsConstructor
public class CustomerTypeController {

    private final CustomerTypeService service;

    @GetMapping
    public ApiResponse<List<CustomerTypeDto>> list() {
        return ApiResponse.success(service.listAll());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CustomerTypeDto> create(@Valid @RequestBody CreateCustomerTypeRequest req) {
        return ApiResponse.success(service.create(req));
    }
}
