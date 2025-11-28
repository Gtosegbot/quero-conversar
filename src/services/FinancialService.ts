export interface SplitResult {
    userAmount: number;
    platformAmount: number;
    userPercentage: number;
    platformPercentage: number;
}

export type UserRole = 'professional' | 'partner';

export const calculateSplit = (
    amount: number,
    role: UserRole,
    isModerator: boolean
): SplitResult => {
    let userPercentage = 0;

    if (role === 'professional') {
        userPercentage = isModerator ? 0.80 : 0.75;
    } else if (role === 'partner') {
        userPercentage = isModerator ? 0.80 : 0.70;
    }

    const platformPercentage = 1 - userPercentage;
    const userAmount = amount * userPercentage;
    const platformAmount = amount * platformPercentage;

    return {
        userAmount: Number(userAmount.toFixed(2)),
        platformAmount: Number(platformAmount.toFixed(2)),
        userPercentage: userPercentage * 100,
        platformPercentage: platformPercentage * 100
    };
};

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};
