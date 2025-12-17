import { useQuery } from '@tanstack/react-query';
import { Trade, CapitalMovement } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Definir a interface para os dados retornados pelo novo endpoint
interface DashboardOverviewData {
  trades: Trade[];
  capitalMovements: CapitalMovement[];
  virtualBalance: Decimal;
  usdtToBrlRate: number;
}

const fetchDashboardOverviewData = async (): Promise<DashboardOverviewData> => {
  const response = await fetch('/api/dashboard/overview');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard overview data');
  }
  return response.json();
};

export const useDashboardOverview = () => {
  return useQuery<DashboardOverviewData>({
    queryKey: ['dashboardOverview'],
    queryFn: fetchDashboardOverviewData,
  });
};
