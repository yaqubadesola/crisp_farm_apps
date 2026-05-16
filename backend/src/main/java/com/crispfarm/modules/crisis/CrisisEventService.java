package com.crispfarm.modules.crisis;

import com.crispfarm.common.dto.PageResponse;
import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.crisis.dto.CrisisEventDto;
import com.crispfarm.modules.crisis.dto.SaveCrisisEventRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CrisisEventService {

    private static final List<String> VALID_SEVERITIES = List.of("LOW", "MEDIUM", "HIGH", "CRITICAL");

    private final CrisisEventRepository repo;

    @Transactional
    public CrisisEventDto create(SaveCrisisEventRequest req) {
        String severity = normaliseSeverity(req.severity());
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        CrisisEvent event = CrisisEvent.builder()
                .tenantId(TenantContext.get())
                .eventDate(req.eventDate())
                .title(req.title().trim())
                .severity(severity)
                .affectedCount(req.affectedCount())
                .solution(req.solution())
                .description(req.description())
                .resolved(req.resolved() != null ? req.resolved() : false)
                .recordedBy(username)
                .build();
        return CrisisEventDto.from(repo.save(event));
    }

    @Transactional(readOnly = true)
    public PageResponse<CrisisEventDto> list(LocalDate from, LocalDate to, int page, int size) {
        LocalDate f = from != null ? from : LocalDate.of(LocalDate.now().getYear(), 1, 1);
        LocalDate t = to != null ? to : LocalDate.now();
        return PageResponse.from(
                repo.findByTenantAndDateRange(TenantContext.get(), f, t, PageRequest.of(page, size))
                        .map(CrisisEventDto::from)
        );
    }

    @Transactional
    public CrisisEventDto update(Long id, SaveCrisisEventRequest req) {
        Long tenantId = TenantContext.get();
        CrisisEvent event = repo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> ApiException.notFound("Crisis event not found"));
        if (req.eventDate() != null)    event.setEventDate(req.eventDate());
        if (req.title() != null && !req.title().isBlank()) event.setTitle(req.title().trim());
        if (req.severity() != null)     event.setSeverity(normaliseSeverity(req.severity()));
        if (req.affectedCount() != null) event.setAffectedCount(req.affectedCount());
        if (req.solution() != null)     event.setSolution(req.solution());
        if (req.description() != null)  event.setDescription(req.description());
        if (req.resolved() != null)     event.setResolved(req.resolved());
        return CrisisEventDto.from(repo.save(event));
    }

    @Transactional
    public void delete(Long id) {
        Long tenantId = TenantContext.get();
        CrisisEvent event = repo.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> ApiException.notFound("Crisis event not found"));
        repo.delete(event);
    }

    private String normaliseSeverity(String raw) {
        if (raw == null || raw.isBlank()) return "MEDIUM";
        String upper = raw.toUpperCase().trim();
        if (!VALID_SEVERITIES.contains(upper)) {
            throw ApiException.badRequest("Invalid severity '" + raw +
                    "'. Valid values: " + VALID_SEVERITIES);
        }
        return upper;
    }
}
