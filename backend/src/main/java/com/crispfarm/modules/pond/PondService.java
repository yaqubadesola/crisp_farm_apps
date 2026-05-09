package com.crispfarm.modules.pond;

import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.pond.dto.PondDto;
import com.crispfarm.modules.pond.dto.SavePondRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PondService {

    private final PondRepository repo;

    public List<PondDto> listAll(boolean activeOnly) {
        Long tid = TenantContext.get();
        return (activeOnly
                ? repo.findAllByTenantIdAndActiveOrderByNameAsc(tid, true)
                : repo.findAllByTenantIdOrderByNameAsc(tid))
                .stream().map(PondDto::from).toList();
    }

    @Transactional
    public PondDto create(SavePondRequest req) {
        Pond pond = Pond.builder()
                .tenantId(TenantContext.get())
                .name(req.name())
                .capacityKg(req.capacityKg())
                .notes(req.notes())
                .build();
        return PondDto.from(repo.save(pond));
    }

    @Transactional
    public PondDto update(Long id, SavePondRequest req) {
        Pond pond = find(id);
        pond.setName(req.name());
        pond.setCapacityKg(req.capacityKg());
        pond.setNotes(req.notes());
        return PondDto.from(repo.save(pond));
    }

    @Transactional
    public void deactivate(Long id) {
        Pond pond = find(id);
        pond.setActive(false);
        repo.save(pond);
    }

    public Pond find(Long id) {
        return repo.findByIdAndTenantId(id, TenantContext.get())
                .orElseThrow(() -> ApiException.notFound("Pond not found"));
    }
}
