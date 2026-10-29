package com.erpflow.shared.security;

public class TenantContext {

    private static final ThreadLocal<Long> CURRENT_COMPANY_ID = new ThreadLocal<>();
    private static final ThreadLocal<Long> CURRENT_USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_USER_EMAIL = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(Long companyId, Long userId, String email) {
        CURRENT_COMPANY_ID.set(companyId);
        CURRENT_USER_ID.set(userId);
        CURRENT_USER_EMAIL.set(email);
    }

    public static Long getCurrentCompanyId() {
        return CURRENT_COMPANY_ID.get();
    }

    public static Long getCurrentUserId() {
        return CURRENT_USER_ID.get();
    }

    public static String getCurrentUserEmail() {
        return CURRENT_USER_EMAIL.get();
    }

    public static void clear() {
        CURRENT_COMPANY_ID.remove();
        CURRENT_USER_ID.remove();
        CURRENT_USER_EMAIL.remove();
    }
}
