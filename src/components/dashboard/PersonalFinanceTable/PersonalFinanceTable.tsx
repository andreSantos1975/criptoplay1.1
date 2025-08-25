import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Expense, ExpenseSummary } from "@/types/personal-finance";
import { PersonalFinanceSummary } from "../PersonalFinanceSummary/PersonalFinanceSummary";
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



const deleteExpense = async (id: string): Promise<void> => {
  const response = await fetch(`/api/expenses/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete expense");
  }
};

interface PersonalFinanceTableProps {
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  summary: ExpenseSummary;
  expenses: Expense[];
  isLoading: boolean;
  isError: boolean;
}

export const PersonalFinanceTable = ({
  onAddExpense,
  onEditExpense,
  summary,
  expenses,
  isLoading,
  isError,
}: PersonalFinanceTableProps) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

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

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
            <Button onClick={onAddExpense} className={styles.addButton}>
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
                {paginatedExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className={styles.noResults}>
                      Nenhuma despesa encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedExpenses.map((expense) => (
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
                            onClick={() => onEditExpense(expense)}
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
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span>Página {currentPage} de {totalPages}</span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};