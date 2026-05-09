package com.crispfarm.common.tenant;

public class TenantContext {

    private static final ThreadLocal<Long> CURRENT_TENANT = new ThreadLocal<>();

    public static Long get() {
        Long id = CURRENT_TENANT.get();
        if (id == null) throw new IllegalStateException("No tenant in context");
        return id;
    }

    public static void set(Long tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
