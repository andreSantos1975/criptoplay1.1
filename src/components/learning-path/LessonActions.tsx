"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface LessonActionsProps {
  slug: string;
  nextSlug?: string;
  isCompleted?: boolean;
}

export function LessonActions({ slug, nextSlug, isCompleted: initialCompleted }: LessonActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialCompleted || false);
  const router = useRouter();

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) throw new Error("Falha ao salvar progresso");

      setIsCompleted(true);
      toast.success("Aula concluída com sucesso!");
      
      router.refresh(); // Atualiza os dados da página/layout

      if (nextSlug) {
        // Pequeno delay para o usuário ver o feedback visual
        setTimeout(() => {
          router.push(`/academia-criptoplay/${nextSlug}`);
        }, 1500);
      } else {
        setTimeout(() => {
          router.push("/academia-criptoplay");
        }, 1500);
      }
    } catch (error) {
      toast.error("Erro ao completar aula. Tente novamente.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-border">
      <Button
        onClick={handleComplete}
        disabled={isLoading || isCompleted}
        className="w-full sm:w-auto"
        variant={isCompleted ? "outline" : "default"}
      >
        {isCompleted ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            Aula Concluída
          </>
        ) : (
          <>
            {isLoading ? "Salvando..." : "Marcar como Concluída"}
          </>
        )}
      </Button>

      {nextSlug && (
        <Button
          onClick={() => router.push(`/academia-criptoplay/${nextSlug}`)}
          variant="ghost"
          className="w-full sm:w-auto ml-auto"
        >
          Próxima Aula
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
      
       {!nextSlug && (
        <Button
          onClick={() => router.push(`/academia-criptoplay`)}
          variant="ghost"
          className="w-full sm:w-auto ml-auto"
        >
          Voltar para Academia
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
