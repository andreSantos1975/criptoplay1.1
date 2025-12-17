import { useQuery } from '@tanstack/react-query';
import { BudgetCategory } from '@prisma/client';

const BUDGET_CATEGORIES_QUERY_KEY = 'budgetCategories';

const fetchBudgetCategories = async (): Promise<BudgetCategory[]> => {
    const response = await fetch('/api/budget/categories');
    if (!response.ok) {
        throw new Error('Failed to fetch budget categories');
    }
    return response.json();
};

export const useBudgetCategories = () => {
    return useQuery<BudgetCategory[]>({
        queryKey: [BUDGET_CATEGORIES_QUERY_KEY],
        queryFn: fetchBudgetCategories,
    });
};
