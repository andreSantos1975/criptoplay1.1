import { useState, useEffect } from "react";
import { Expense, Income } from "@/types/personal-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./PersonalFinanceDialog.module.css";

interface PersonalFinanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Expense, "id"> | Omit<Income, "id">, type: "expense" | "income") => void;
  item?: Expense | Income;
  type: "expense" | "income";
}

export function PersonalFinanceDialog({
  isOpen,
  onClose,
  onSave,
  item,
  type,
}: PersonalFinanceDialogProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [status, setStatus] = useState<"Pendente" | "Pago">("Pendente");

  useEffect(() => {
    if (item) {
      if (type === "expense") {
        const expenseItem = item as Expense;
        setDescription(expenseItem.categoria || '');
        setAmount(expenseItem.valor ? expenseItem.valor.toString() : "");
        if (expenseItem.dataVencimento) {
          const parsedDate =
            expenseItem.dataVencimento instanceof Date
              ? expenseItem.dataVencimento
              : new Date(expenseItem.dataVencimento);
          setDate(parsedDate);
        } else {
          setDate(undefined);
        }
        setStatus(expenseItem.status);
      } else if (type === "income") {
        const incomeItem = item as Income;
        setDescription(incomeItem.description || '');
        setAmount(incomeItem.amount ? incomeItem.amount.toString() : "");
        if (incomeItem.date) {
          const parsedDate =
            incomeItem.date instanceof Date
              ? incomeItem.date
              : new Date(incomeItem.date);
          setDate(parsedDate);
        } else {
          setDate(undefined);
        }
        // Income does not have status
        setStatus("Pendente");
      }
    } else {
      setDescription("");
      setAmount("");
      setDate(undefined);
      setStatus("Pendente");
    }
  }, [item, isOpen, type]);

  const handleSave = () => {
    if (!description || !amount || !date) return;

    const numericAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numericAmount)) return;

    if (type === "expense") {
      onSave({
        categoria: description,
        valor: numericAmount,
        dataVencimento: date,
        status,
      }, "expense");
    } else if (type === "income") {
      onSave({
        description,
        amount: numericAmount,
        date,
      }, "income");
    }

    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^\d,.]/g, "");
    setAmount(value);
  };

  const isFormValid =
    description &&
    amount &&
    date &&
    !isNaN(parseFloat(amount.replace(",", ".")));

  if (!isOpen) return null;

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialogContent}>
        <div className={styles.dialogHeader}>
          <h3 className={styles.dialogTitle}>
            {item
              ? type === "expense"
                ? "Editar Despesa"
                : "Editar Renda"
              : type === "expense"
              ? "Nova Despesa"
              : "Nova Renda"}
          </h3>
          <p className={styles.dialogDescription}>
            {item
              ? type === "expense"
                ? "Altere os dados da despesa."
                : "Altere os dados da renda."
              : type === "expense"
              ? "Adicione uma nova despesa ao seu controle financeiro."
              : "Adicione uma nova renda ao seu controle financeiro."}
          </p>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <Label htmlFor="description">
              {type === "expense" ? "Categoria" : "Descrição"}
            </Label>
            <Input
              id="description"
              placeholder={
                type === "expense"
                  ? "Ex: Conta de Água"
                  : "Ex: Salário, Freelance"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              placeholder="Ex: 150,00"
              value={amount}
              onChange={handleAmountChange}
            />
          </div>

          <div className={styles.formGroup}>
            <Label htmlFor="date">
              {type === "expense" ? "Data de Vencimento" : "Data"}
            </Label>
            <Input
              id="date"
              type="date"
              value={
                date instanceof Date && !isNaN(date.getTime())
                  ? date.toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => setDate(new Date(e.target.value))}
            />
          </div>

          {type === "expense" && (
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
          )}
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
            {item
              ? "Salvar Alterações"
              : type === "expense"
              ? "Adicionar Despesa"
              : "Adicionar Renda"}
          </Button>
        </div>
      </div>
    </div>
  );
}
