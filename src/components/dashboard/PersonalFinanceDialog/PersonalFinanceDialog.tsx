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
  const [applyEconomy, setApplyEconomy] = useState(false); // New state for the checkbox

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
        // Reset applyEconomy when item changes or dialog opens for a new item
        setApplyEconomy(false); 
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
        setApplyEconomy(false); // Reset for income as well
      }
    } else {
      setDescription("");
      setAmount("");
      setDate(undefined);
      setStatus("Pendente");
      setApplyEconomy(false); // Reset for new items
    }
  }, [item, isOpen, type]);

  const handleSave = () => {
    if (!description || !amount || !date) return;

    const numericAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numericAmount)) return;

    if (type === "expense") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expenseData: any = {
        categoria: description,
        valor: numericAmount,
        dataVencimento: date,
        status,
      };

      const existingExpense = item as Expense;

      if (item && existingExpense.id) { // Logic for editing an existing expense
        if (applyEconomy) {
          // Set originalValor from the existing value if it's not already set.
          // Otherwise, preserve the already existing originalValor.
          expenseData.originalValor = existingExpense.originalValor ?? existingExpense.valor;
        } else {
          // If the user unchecks the box, reset the economy calculation fields.
          expenseData.originalValor = null;
        }
      }
      // Note: The logic for creating a new expense is not part of this fix.

      onSave(expenseData, "expense");
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

          {/* New checkbox for economy calculation */}
          {type === "expense" && item && ( // Only show for existing expenses
            <div className={styles.formGroup}>
              <input
                type="checkbox"
                id="applyEconomy"
                checked={applyEconomy}
                onChange={(e) => setApplyEconomy(e.target.checked)}
                className={styles.checkbox} // You might need to define this style
              />
              <Label htmlFor="applyEconomy">Aplicar cálculo de economia</Label>
            </div>
          )}

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
