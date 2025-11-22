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
    if (isOpen && item) {
      if (type === "expense") {
        const expenseItem = item as Expense;
        setDescription(expenseItem.categoria || '');
        setAmount(expenseItem.valor ? expenseItem.valor.toString() : "");
        setDate(expenseItem.dataVencimento ? new Date(expenseItem.dataVencimento) : undefined);
        setStatus(expenseItem.status as "Pendente" | "Pago");
        // Correctly initialize the checkbox based on the item's state
        setApplyEconomy(expenseItem.originalValor != null);
      } else if (type === "income") {
        const incomeItem = item as Income;
        setDescription(incomeItem.description || '');
        setAmount(incomeItem.amount ? incomeItem.amount.toString() : "");
        setDate(incomeItem.date ? new Date(incomeItem.date) : undefined);
        setStatus("Pendente");
        setApplyEconomy(false);
      }
    } else {
      // Reset fields for a new item
      setDescription("");
      setAmount("");
      setDate(undefined);
      setStatus("Pendente");
      setApplyEconomy(false);
    }
  }, [item, isOpen, type]);

  const handleSave = () => {
    if (!description || !amount || !date) return;

    const numericAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numericAmount)) return;

    let payload;

    if (type === "expense") {
      const expenseData: Partial<Expense> & { categoria: string; valor: number; dataVencimento: Date; status: string } = {
        categoria: description,
        valor: numericAmount,
        dataVencimento: date,
        status,
      };

      const existingExpense = item as Expense;

      if (item && existingExpense.id) {
        if (applyEconomy) {
          expenseData.originalValor = existingExpense.originalValor ?? existingExpense.valor;
        } else {
          expenseData.originalValor = undefined;
          expenseData.savedAmount = undefined;
        }
      }
      payload = expenseData;
    } else if (type === "income") {
      payload = {
        description,
        amount: numericAmount,
        date,
      };
    }
    
    console.log("Dialog: Salvando item...", { type, payload });
    onSave(payload as Omit<Expense, 'id'> | Omit<Income, 'id'>, type);
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
              onChange={(e) => {
                const date = new Date(e.target.value);
                const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                setDate(new Date(date.getTime() + userTimezoneOffset));
              }}
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
