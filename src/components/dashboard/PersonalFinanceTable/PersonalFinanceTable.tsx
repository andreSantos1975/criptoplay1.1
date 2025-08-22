import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Expense, ExpenseSummary } from "@/types/personal-finance";
import { PersonalFinanceSummary } from "../PersonalFinanceSummary/PersonalFinanceSummary";
import { PersonalFinanceDialog } from "../PersonalFinanceDialog/PersonalFinanceDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Search, Plus, Loader } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "./PersonalFinanceTable.module.css";

// Funções da API
const fetchExpenses = async (): Promise<Expense[]> => {
  const response = await fetch("/api/expenses");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

const addExpense = async (newExpense: Omit<Expense, 'id'>): Promise<Expense> => {
  const response = await fetch("/api/expenses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newExpense),
  });
  if (!response.ok) {
    throw new Error("Failed to add expense");
  }
  return response.json();
};

const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
  const response = await fetch(`/api/expenses/${updatedExpense.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedExpense),
  });
  if (!response.ok) {
    throw new Error("Failed to update expense");
  }
  return response.json();
};

const deleteExpense = async (id: string): Promise<void> => {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete expense");
  }
};

export const PersonalFinanceTable = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: expenses = [], isLoading, isError } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
  });

  const addMutation = useMutation({
    mutationFn: addExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const summary: ExpenseSummary = useMemo(() => {
    const pendentes = expenses.filter(e => e.status === 'Pendente');
    const pagos = expenses.filter(e => e.status === 'Pago');
    
    return {
      totalPendentes: pendentes.reduce((sum, e) => sum + e.valor, 0),
      totalPagos: pagos.reduce((sum, e) => sum + e.valor, 0),
      totalGeral: expenses.reduce((sum, e) => sum + e.valor, 0),
      countPendentes: pendentes.length,
      countPagos: pagos.length,
    };
  }, [expenses]);

  const handleAddExpense = () => {
    setEditingExpense(undefined);
    setIsDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleSaveExpense = (expenseData: Omit<Expense, 'id'>) => {
    if (editingExpense) {
      updateMutation.mutate({ ...expenseData, id: editingExpense.id });
    } else {
      addMutation.mutate(expenseData);
    }
  };

  const handleDeleteExpense = (id: string) => {
    deleteMutation.mutate(id);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">
        Ocorreu um erro ao buscar as despesas.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PersonalFinanceSummary summary={summary} />
      
      <Card className={styles.card}>
        <CardHeader className={styles.cardHeader}>
          <div className={styles.headerTop}>
            <CardTitle className={styles.cardTitle}>Minhas Despesas</CardTitle>
            <Button onClick={handleAddExpense} className={styles.addButton}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Despesa
            </Button>
          </div>
          
          <div className={styles.filters}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} />
              <Input
                placeholder="Buscar por categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={styles.selectTrigger}>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendentes</SelectItem>
                <SelectItem value="Pago">Pagos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className={styles.tableWrapper}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className={styles.noResults}>
                      Nenhuma despesa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className={styles.categoryCell}>
                        {expense.categoria}
                      </TableCell>
                      <TableCell className={styles.valueCell}>
                        {formatCurrency(expense.valor)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(expense.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`${styles.status} ${
                            expense.status === "Pago"
                              ? styles.statusPaid
                              : styles.statusPending
                          }`}>
                          {expense.status}
                        </span>
                      </TableCell>
                      <TableCell className={styles.actionsCell}>
                        <div className={styles.actionsWrapper}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                          >
                            <Edit className={styles.actionIcon} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className={styles.actionIcon} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PersonalFinanceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveExpense}
        expense={editingExpense}
      />
    </div>
  );
};