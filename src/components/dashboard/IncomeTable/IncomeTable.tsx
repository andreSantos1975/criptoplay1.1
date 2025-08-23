import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Income } from "@/types/personal-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import styles from "./IncomeTable.module.css";

// Funções da API
const fetchIncomes = async (): Promise<Income[]> => {
  const response = await fetch("/api/incomes");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

const deleteIncome = async (id: string): Promise<void> => {
  const response = await fetch(`/api/incomes/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete income");
  }
};

interface IncomeTableProps {
  onAddIncome: () => void;
  onEditIncome: (income: Income) => void;
}

export const IncomeTable = ({ onAddIncome, onEditIncome }: IncomeTableProps) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: incomes = [], isLoading, isError } = useQuery<Income[]>({
    queryKey: ['incomes'],
    queryFn: fetchIncomes,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });

  const handleDeleteIncome = (id: string) => {
    deleteMutation.mutate(id);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredIncomes = incomes.filter(income => {
    const matchesSearch = income.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage);
  const paginatedIncomes = filteredIncomes.slice(
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
        Ocorreu um erro ao buscar as rendas.
      </div>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.cardHeader}>
        <div className={styles.headerTop}>
          <CardTitle className={styles.cardTitle}>Minhas Rendas</CardTitle>
          <Button onClick={onAddIncome} className={styles.addButton}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Renda
          </Button>
        </div>
        
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <Input
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={styles.tableWrapper}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedIncomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className={styles.noResults}>
                    Nenhuma renda encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedIncomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell className={styles.descriptionCell}>
                      {income.description}
                    </TableCell>
                    <TableCell className={styles.valueCell}>
                      {formatCurrency(income.amount)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(income.date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className={styles.actionsCell}>
                      <div className={styles.actionsWrapper}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditIncome(income)}
                        >
                          <Edit className={styles.actionIcon} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteIncome(income.id)}
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
  );
};
