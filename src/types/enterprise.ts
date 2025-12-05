// Enterprise Company Data Models

export interface Company {
    id: string;
    name: string;
    cnpj: string;
    plan: 'enterprise';
    admin_uid: string;
    admin_email: string;
    employee_count: number;
    active_employees: number;
    max_employees: number | null;
    created_at: Date;
    settings: {
        allow_self_registration: boolean;
        email_domain?: string; // Optional: "@empresa.com.br"
        custom_benefits: string[];
    };
    billing: {
        status: 'active' | 'suspended' | 'trial';
        tier: 'up_to_100' | 'up_to_200' | 'unlimited';
        price_per_employee: number;
        next_billing_date: Date;
        total_amount: number;
    };
}

export interface CompanyEmployee {
    id: string;
    company_id: string;
    user_id: string;
    email: string;
    name: string;
    status: 'invited' | 'active' | 'suspended' | 'removed';
    role: 'employee' | 'manager' | 'admin';
    department?: string;
    position?: string;
    joined_at: Date;
    invited_at: Date;
    invited_by: string;
    previous_plan: 'free' | 'premium';
    custom_permissions: {
        access_dashboard: boolean;
        can_invite_others: boolean;
        can_schedule_sessions: boolean;
    };
}

export interface EmployeeInvite {
    id: string;
    company_id: string;
    email: string;
    name?: string;
    department?: string;
    position?: string;
    invite_token: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    invited_by: string;
    invited_at: Date;
    expires_at: Date;
    accepted_at?: Date;
    metadata: {
        source: 'csv' | 'manual' | 'self_registration';
        csv_batch_id?: string;
    };
}

export interface PricingTier {
    id: 'up_to_100' | 'up_to_200' | 'unlimited';
    name: string;
    max_employees: number | null;
    price_per_employee: number;
    min_employees: number;
    discount_percentage: number;
}

// Pricing Tiers (Preço decrescente)
export const PRICING_TIERS: PricingTier[] = [
    {
        id: 'up_to_100',
        name: 'Até 100 funcionários',
        max_employees: 100,
        min_employees: 1,
        price_per_employee: 29.90,
        discount_percentage: 0
    },
    {
        id: 'up_to_200',
        name: 'Até 200 funcionários',
        max_employees: 200,
        min_employees: 101,
        price_per_employee: 24.90, // ~17% desconto
        discount_percentage: 17
    },
    {
        id: 'unlimited',
        name: '200+ funcionários',
        max_employees: null,
        min_employees: 201,
        price_per_employee: 19.90, // ~33% desconto
        discount_percentage: 33
    }
];

export const calculateCompanyPrice = (employeeCount: number): { tier: PricingTier; total: number } => {
    const tier = PRICING_TIERS.find(t =>
        employeeCount >= t.min_employees &&
        (t.max_employees === null || employeeCount <= t.max_employees)
    ) || PRICING_TIERS[0];

    return {
        tier,
        total: employeeCount * tier.price_per_employee
    };
};
