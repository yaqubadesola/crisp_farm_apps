package com.crispfarm.modules.customer;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.common.dto.PageResponse;
import com.crispfarm.modules.customer.dto.CustomerDto;
import com.crispfarm.modules.customer.dto.SaveCustomerRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','SALES_OFFICER','FARM_MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<CustomerDto>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(search, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SALES_OFFICER','FARM_MANAGER')")
    public ResponseEntity<ApiResponse<CustomerDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','SALES_OFFICER','FARM_MANAGER')")
    public ResponseEntity<ApiResponse<CustomerDto>> create(@Valid @RequestBody SaveCustomerRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','SALES_OFFICER')")
    public ResponseEntity<ApiResponse<CustomerDto>> update(@PathVariable Long id,
                                                            @Valid @RequestBody SaveCustomerRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
