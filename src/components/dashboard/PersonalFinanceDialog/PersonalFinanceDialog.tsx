import { useState, useEffect } from "react";
import { Expense, Income } from "@/types/personal-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "./PersonalFinanceDialog.module.css";

interface PersonalFinanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    item: Omit<Expense, "id"> | Omit<Income, "id">,
    type: "expense" | "income"
  ) => void;
  item?: Expense | Income;
  type: "expense" | "income";
  isLoading?: boolean;
}

export function PersonalFinanceDialog({
  isOpen,
  onClose,
  onSave,
  item,
  type,
  isLoading = false,
}: PersonalFinanceDialogProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dateString, setDateString] = useState("");
  const [status, setStatus] = useState<"Pendente" | "Pago">("Pendente");
  const [applySavingsCalculation, setApplySavingsCalculation] = useState(false); // Renamed state

  useEffect(() => {
    if (isOpen && item) {
      if (type === "expense") {
        const expenseItem = item as Expense;
        setDescription(expenseItem.categoria || "");
        setAmount(expenseItem.valor ? expenseItem.valor.toString() : "");
        setDateString(
          expenseItem.dataVencimento
            ? new Date(expenseItem.dataVencimento).toISOString().split('T')[0]
            : ""
        );
        setStatus(expenseItem.status as "Pendente" | "Pago");
        // Initialize checkbox based on the new field
        setApplySavingsCalculation(expenseItem.applySavingsCalculation ?? false);
      } else if (type === "income") {
        const incomeItem = item as Income;
        setDescription(incomeItem.description || "");
        setAmount(incomeItem.amount ? incomeItem.amount.toString() : "");
        setDateString(
            incomeItem.date 
            ? new Date(incomeItem.date).toISOString().split('T')[0] 
            : ""
        );
        setStatus("Pendente");
        setApplySavingsCalculation(false);
      }
    } else {
      // Reset fields for a new item
      setDescription("");
      setAmount("");
      setDateString("");
      setStatus("Pendente");
      setApplySavingsCalculation(false);
    }
  }, [item, isOpen, type]);

  const handleSave = () => {
    if (!description || !amount || !dateString) return;

    const numericAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numericAmount)) return;

    // Parse date string to Date object using UTC Noon logic
    const [year, month, day] = dateString.split('-').map(Number);
    const dateObject = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    let payload;

    if (type === "expense") {
      const expenseData: Partial<Expense> & {
        categoria: string;
        valor: number;
        dataVencimento: Date;
        status: string;
        applySavingsCalculation: boolean; // Add to payload type
      } = {
        categoria: description,
        valor: numericAmount,
        dataVencimento: dateObject,
        status,
        applySavingsCalculation: applySavingsCalculation, // Pass state to payload
      };

      const existingExpense = item as Expense;

      // New logic for saving economy fields
      if (applySavingsCalculation && item) {
          // If it's an existing item and we are applying savings
          expenseData.originalValor = existingExpense.originalValor ?? existingExpense.valor;
          expenseData.savedAmount = expenseData.originalValor - numericAmount;
      } else {
          // If we are not applying savings, clear the fields
          expenseData.originalValor = undefined;
          expenseData.savedAmount = undefined;
      }
      
      payload = expenseData;

    } else if (type === "income") {
      payload = {
        description,
        amount: numericAmount,
        date: dateObject,
      };
    }

    onSave(payload as Omit<Expense, "id"> | Omit<Income, "id">, type);
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
    dateString &&
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
            {type === "expense" ? (
              <Input
                id="description"
                placeholder="Digite o nome da categoria"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            ) : (
              <Input
                id="description"
                placeholder="Ex: Salário, Freelance"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
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
          {type === "expense" &&
            item && ( // Only show for existing expenses
              <div className={styles.formGroup}>
                <input
                  type="checkbox"
                  id="applySavingsCalculation"
                  checked={applySavingsCalculation}
                  onChange={(e) => setApplySavingsCalculation(e.target.checked)}
                  className={styles.checkbox} // You might need to define this style
                />
                <Label htmlFor="applySavingsCalculation">
                  Aplicar cálculo de economia
                </Label>
              </div>
            )}

          <div className={styles.formGroup}>
            <Label htmlFor="date">
              {type === "expense" ? "Data de Vencimento" : "Data"}
            </Label>
            <Input
              id="date"
              type="date"
              value={dateString}
              onChange={(e) => setDateString(e.target.value)}
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
            disabled={!isFormValid || isLoading}
            className={styles.saveButton}
          >
            {isLoading 
              ? "Salvando..." 
              : item
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