import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Diamond } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "@/app/ranking/ranking.module.css";

interface VisibilityToggleProps {
  isPublic: boolean;
  onToggle: (value: boolean) => void;
  isSubscriber: boolean;
}

export function VisibilityToggle({ isPublic, onToggle, isSubscriber }: VisibilityToggleProps) {
  if (!isSubscriber) {
    return (
      <div className={styles.toggleCard}>
        <div className={cn(styles.toggleIconBox, "bg-gray-100")}>
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1 opacity-60">
          <p className="font-semibold text-gray-900">Visibilidade no Ranking</p>
          <p className="text-sm text-gray-500">
            Disponível apenas para assinantes CriptoPlay (incluindo período de teste).
          </p>
        </div>
        <Switch disabled checked={false} />
      </div>
    );
  }

  return (
    <div className={styles.toggleCard} style={{ borderColor: 'rgba(124, 58, 237, 0.3)' }}>
      <div className={cn(
        styles.toggleIconBox,
        isPublic ? "bg-emerald-50" : "bg-gray-100"
      )}>
        {isPublic ? (
          <Eye className="h-5 w-5 text-emerald-600" />
        ) : (
          <EyeOff className="h-5 w-5 text-gray-400" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Label htmlFor="visibility-toggle" className="font-semibold text-gray-900 cursor-pointer">
            Exibir minha performance publicamente
          </Label>
          <Diamond className="h-3.5 w-3.5 text-violet-600" />
        </div>
        <p className="text-sm text-gray-500">
          {isPublic 
            ? "Sua performance está visível para todos no ranking público."
            : "Sua performance está oculta. Apenas você pode ver sua posição."
          }
        </p>
      </div>
      <Switch
        id="visibility-toggle"
        checked={isPublic}
        onCheckedChange={onToggle}
      />
    </div>
  );
}