package com.crispfarm.modules.pricing;

import com.crispfarm.common.dto.ApiResponse;
import com.crispfarm.modules.pricing.dto.PricingTierDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/pricing/tiers")
@RequiredArgsConstructor
public class PricingTierController {

    private final PricingTierService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PricingTierDto>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(service.listAll()));
    }

    @PutMapping("/{tierName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PricingTierDto>> update(
            @PathVariable String tierName,
            @RequestBody Map<String, BigDecimal> body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(tierName, body.get("pricePerKg"))));
    }
}
