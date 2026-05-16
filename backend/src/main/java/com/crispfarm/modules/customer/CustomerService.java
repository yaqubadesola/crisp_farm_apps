package com.crispfarm.modules.customer;

import com.crispfarm.common.dto.PageResponse;
import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.customer.dto.CustomerDto;
import com.crispfarm.modules.customer.dto.SaveCustomerRequest;
import com.crispfarm.modules.sales.SalesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository repo;
    private final CustomerTypeRepository customerTypeRepo;
    private final SalesRepository salesRepo;

    public PageResponse<CustomerDto> list(String search, int page, int size) {
        return PageResponse.from(
                repo.search(TenantContext.get(), search, PageRequest.of(page, size))
                        .map(CustomerDto::from)
        );
    }

    public CustomerDto getById(Long id) {
        return CustomerDto.from(findOwned(id));
    }

    public CustomerDto create(SaveCustomerRequest req) {
        Customer c = Customer.builder()
                .tenantId(TenantContext.get())
                .name(req.name())
                .phone(req.phone())
                .email(req.email())
                .address(req.address())
                .customerType(parseType(req.customerType()))
                .build();
        return CustomerDto.from(repo.save(c));
    }

    public CustomerDto update(Long id, SaveCustomerRequest req) {
        Customer c = findOwned(id);
        c.setName(req.name());
        c.setPhone(req.phone());
        c.setEmail(req.email());
        c.setAddress(req.address());
        if (req.customerType() != null) c.setCustomerType(parseType(req.customerType()));
        return CustomerDto.from(repo.save(c));
    }

    public void delete(Long id) {
        Long tenantId = TenantContext.get();
        Customer c = repo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> ApiException.notFound("Customer not found"));
        long salesCount = salesRepo.countByCustomerIdAndTenantId(id, tenantId);
        if (salesCount > 0) {
            throw ApiException.badRequest(
                "Cannot delete customer with existing sales records (" + salesCount + " sale(s)). " +
                "Delete or reassign the sales first.");
        }
        repo.delete(c);
    }

    public Customer findOwned(Long id) {
        return repo.findByIdAndTenantId(id, TenantContext.get())
                .orElseThrow(() -> ApiException.notFound("Customer not found"));
    }

    private String parseType(String type) {
        if (type == null || type.isBlank()) return "RETAIL";
        String normalized = type.toUpperCase().trim();
        Long tenantId = TenantContext.get();
        if (!customerTypeRepo.existsByTypeNameIgnoreCaseAndTenantId(normalized, tenantId)) {
            throw ApiException.badRequest("Invalid customer type: " + type);
        }
        return normalized;
    }
}
