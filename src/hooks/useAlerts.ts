import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@prisma/client';
import toast from 'react-hot-toast';

const ALERTS_QUERY_KEY = 'alerts';

// --- Fetch Alerts ---
const fetchAlerts = async (): Promise<Alert[]> => {
  const response = await fetch('/api/alerts');
  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }
  return response.json();
};

export const useAlerts = () => {
  return useQuery<Alert[]>({
    queryKey: [ALERTS_QUERY_KEY],
    queryFn: fetchAlerts,
  });
};

// --- Create Alert ---
const createAlert = async (newAlert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Alert> => {
    const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAlert),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create alert' }));
        throw new Error(errorData.message);
    }
    return response.json();
}

export const useCreateAlert = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAlert,
        onSuccess: () => {
            toast.success('Alerta criado com sucesso!');
            queryClient.invalidateQueries({ queryKey: [ALERTS_QUERY_KEY] });
        },
        onError: (error: Error) => {
            toast.error(`Erro ao criar alerta: ${error.message}`);
        }
    });
};

// --- Update Alert ---
const updateAlert = async (alertToUpdate: Partial<Alert> & { id: string }): Promise<Alert> => {
    const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertToUpdate),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update alert' }));
        throw new Error(errorData.message);
    }
    return response.json();
}

export const useUpdateAlert = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateAlert,
        onSuccess: () => {
            toast.success('Alerta atualizado com sucesso!');
            queryClient.invalidateQueries({ queryKey: [ALERTS_QUERY_KEY] });
        },
        onError: (error: Error) => {
            toast.error(`Erro ao atualizar alerta: ${error.message}`);
        }
    });
}


// --- Delete Alert ---
const deleteAlert = async (alertId: string): Promise<void> => {
    const response = await fetch(`/api/alerts?id=${alertId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete alert' }));
        throw new Error(errorData.message);
    }
}

export const useDeleteAlert = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAlert,
        onSuccess: () => {
            toast.success('Alerta excluído com sucesso!');
            queryClient.invalidateQueries({ queryKey: [ALERTS_QUERY_KEY] });
        },
        onError: (error: Error) => {
            toast.error(`Erro ao excluir alerta: ${error.message}`);
        }
    });
}
