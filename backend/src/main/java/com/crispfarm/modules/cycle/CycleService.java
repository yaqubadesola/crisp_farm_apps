package com.crispfarm.modules.cycle;

import com.crispfarm.common.exception.ApiException;
import com.crispfarm.common.tenant.TenantContext;
import com.crispfarm.modules.cycle.dto.*;
import com.crispfarm.modules.expense.ExpenseRepository;
import com.crispfarm.modules.inventory.InventoryTransactionRepository;
import com.crispfarm.modules.pond.PondRepository;
import com.crispfarm.modules.sales.SalesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CycleService {

    private final CycleRepository cycleRepo;
    private final MortalityRepository mortalityRepo;
    private final PondRepository pondRepo;
    private final SalesRepository salesRepo;
    private final ExpenseRepository expenseRepo;
    private final InventoryTransactionRepository txRepo;

    public List<FarmCycleDto> listAll(String status) {
        Long tid = TenantContext.get();
        List<FarmCycle> cycles = status != null
                ? cycleRepo.findAllByTenantIdAndStatusOrderByStartDateDesc(tid, status.toUpperCase())
                : cycleRepo.findAllByTenantIdOrderByStartDateDesc(tid);
        return cycles.stream().map(c -> enrich(c, tid)).toList();
    }

    public FarmCycleDto getActiveCycle() {
        Long tid = TenantContext.get();
        return cycleRepo.findActiveCycle(tid)
                .map(c -> enrich(c, tid))
                .orElse(null);
    }

    @Transactional
    public FarmCycleDto create(CreateCycleRequest req) {
        Long tid = TenantContext.get();
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        FarmCycle cycle = FarmCycle.builder()
                .tenantId(tid)
                .name(req.name())
                .startDate(req.startDate())
                .pondId(req.pondId())
                .fingerlingCount(req.fingerlingCount())
                .fingerlingSource(req.fingerlingSource())
                .expectedYieldKg(req.expectedYieldKg())
                .notes(req.notes())
                .createdBy(username)
                .build();

        return enrich(cycleRepo.save(cycle), tid);
    }

    @Transactional
    public FarmCycleDto harvest(Long id, HarvestRequest req) {
        FarmCycle cycle = findOwned(id);
        if (!"ACTIVE".equals(cycle.getStatus())) {
            throw ApiException.badRequest("Only ACTIVE cycles can be harvested");
        }
        cycle.setActualYieldKg(req.actualYieldKg());
        cycle.setEndDate(req.endDate());
        cycle.setStatus("HARVESTED");
        return enrich(cycleRepo.save(cycle), TenantContext.get());
    }

    @Transactional
    public FarmCycleDto close(Long id) {
        FarmCycle cycle = findOwned(id);
        cycle.setStatus("CLOSED");
        return enrich(cycleRepo.save(cycle), TenantContext.get());
    }

    @Transactional
    public MortalityDto recordMortality(Long cycleId, RecordMortalityRequest req) {
        Long tid = TenantContext.get();
        FarmCycle cycle = findOwned(cycleId);
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        CycleMortality m = CycleMortality.builder()
                .tenantId(tid)
                .cycleId(cycleId)
                .count(req.count())
                .cause(req.cause())
                .recordedDate(req.recordedDate())
                .recordedBy(username)
                .build();

        cycle.setTotalMortalities(cycle.getTotalMortalities() + req.count());
        cycleRepo.save(cycle);
        return MortalityDto.from(mortalityRepo.save(m));
    }

    public List<MortalityDto> getMortalities(Long cycleId) {
        Long tid = TenantContext.get();
        findOwned(cycleId);
        return mortalityRepo.findByCycleIdAndTenantIdOrderByRecordedDateDesc(cycleId, tid)
                .stream().map(MortalityDto::from).toList();
    }

    public CycleProfitDto getProfit(Long cycleId) {
        Long tid = TenantContext.get();
        FarmCycle cycle = findOwned(cycleId);

        BigDecimal revenue = salesRepo.sumRevenueByCycleId(tid, cycleId);
        BigDecimal expenses = expenseRepo.sumByCycleId(tid, cycleId);
        long salesCount = salesRepo.countByCycleId(tid, cycleId);
        BigDecimal netProfit = revenue.subtract(expenses);

        double lossRate = 0;
        if (cycle.getFingerlingCount() != null && cycle.getFingerlingCount() > 0) {
            lossRate = (cycle.getTotalMortalities() * 100.0) / cycle.getFingerlingCount();
        }

        double roi = 0;
        if (expenses.compareTo(BigDecimal.ZERO) > 0) {
            roi = netProfit.divide(expenses, 4, RoundingMode.HALF_UP).doubleValue() * 100;
        }

        return new CycleProfitDto(
                cycle.getId(), cycle.getName(), cycle.getStatus(),
                cycle.getFingerlingCount(), cycle.getExpectedYieldKg(), cycle.getActualYieldKg(),
                cycle.getTotalMortalities(), Math.round(lossRate * 100.0) / 100.0,
                revenue, expenses, netProfit, Math.round(roi * 100.0) / 100.0,
                salesCount
        );
    }

    @Transactional
    public BackfillResultDto backfillCycle(Long cycleId) {
        Long tid = TenantContext.get();
        FarmCycle cycle = cycleRepo.findByIdAndTenantId(cycleId, tid)
                .orElseThrow(() -> ApiException.notFound("Cycle not found"));

        int expenses  = expenseRepo.assignCycleToUnlinked(cycleId, tid);
        int sales     = salesRepo.assignCycleToUnlinked(cycleId, tid);
        int inventory = txRepo.assignCycleToUnlinked(cycleId, tid);

        return new BackfillResultDto(cycleId, cycle.getName(), expenses, sales, inventory,
                expenses + sales + inventory);
    }

    private FarmCycle findOwned(Long id) {
        return cycleRepo.findByIdAndTenantId(id, TenantContext.get())
                .orElseThrow(() -> ApiException.notFound("Cycle not found"));
    }

    private FarmCycleDto enrich(FarmCycle c, Long tid) {
        String pondName = c.getPondId() != null
                ? pondRepo.findByIdAndTenantId(c.getPondId(), tid).map(p -> p.getName()).orElse(null)
                : null;
        return FarmCycleDto.from(c, pondName);
    }
}
