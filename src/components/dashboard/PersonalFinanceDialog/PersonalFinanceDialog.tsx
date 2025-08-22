import { useState, useEffect } from "react";
import { Expense } from "@/types/personal-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./PersonalFinanceDialog.module.css";

interface PersonalFinanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, "id">) => void;
  expense?: Expense;
}

export function PersonalFinanceDialog({
  isOpen,
  onClose,
  onSave,
  expense,
}: PersonalFinanceDialogProps) {
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState<Date | undefined>();
  const [status, setStatus] = useState<"Pendente" | "Pago">("Pendente");

  useEffect(() => {
    if (expense) {
      setCategoria(expense.categoria);
      setValor(expense.valor.toString());

      // 🔹 Garantir que dataVencimento seja um Date válido
      if (expense.dataVencimento) {
        const parsedDate =
          expense.dataVencimento instanceof Date
            ? expense.dataVencimento
            : new Date(expense.dataVencimento);
        setDataVencimento(parsedDate);
      } else {
        setDataVencimento(undefined);
      }

      setStatus(expense.status);
    } else {
      setCategoria("");
      setValor("");
      setDataVencimento(undefined);
      setStatus("Pendente");
    }
  }, [expense, isOpen]);

  const handleSave = () => {
    if (!categoria || !valor || !dataVencimento) return;

    const valorNumerico = parseFloat(valor.replace(",", "."));
    if (isNaN(valorNumerico)) return;

    onSave({
      categoria,
      valor: valorNumerico,
      dataVencimento,
      status,
    });

    onClose();
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^\d,.]/g, "");
    setValor(value);
  };

  const isFormValid =
    categoria &&
    valor &&
    dataVencimento &&
    !isNaN(parseFloat(valor.replace(",", ".")));

  if (!isOpen) return null;

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialogContent}>
        <div className={styles.dialogHeader}>
          <h3 className={styles.dialogTitle}>
            {expense ? "Editar Despesa" : "Nova Despesa"}
          </h3>
          <p className={styles.dialogDescription}>
            {expense
              ? "Altere os dados da despesa."
              : "Adicione uma nova despesa ao seu controle financeiro."}
          </p>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              placeholder="Ex: Conta de Água"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              placeholder="Ex: 150,00"
              value={valor}
              onChange={handleValorChange}
            />
          </div>

          <div className={styles.formGroup}>
            <Label htmlFor="dataVencimento">Data de Vencimento</Label>
            <Input
              id="dataVencimento"
              type="date"
              value={
                dataVencimento instanceof Date &&
                !isNaN(dataVencimento.getTime())
                  ? dataVencimento.toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => setDataVencimento(new Date(e.target.value))}
            />
          </div>

          <div className={styles.formGroup}>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className={styles.selectInput}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "Pendente" | "Pago")
              }
            >
              <option value="Pendente">Pendente</option>
              <option value="Pago">Pago</option>
            </select>
          </div>
        </div>

        <div className={styles.dialogFooter}>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid}
            className={styles.saveButton}
          >
            {expense ? "Salvar Alterações" : "Adicionar Despesa"}
          </Button>
        </div>
      </div>
    </div>
  );
}
