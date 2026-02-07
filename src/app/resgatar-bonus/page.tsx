"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./ResgatarBonusPage.module.css"; // Atualizado para ResgatarBonusPage.module.css

function ResgatarBonusPageContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get("origem") || "plataforma"; // Pega a origem da URL, default 'plataforma'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/bonus/activate", { // Atualizado para /api/bonus/activate
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, origin }), // Inclui a origem na requisição
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Ocorreu um erro ao processar sua solicitação.");
      }

      setMessage({ type: "success", text: data.message || `Seu acesso ao plano Started foi ativado via ${getOriginName(origin)}! Redirecionando...` });
      // Redirecionar para o dashboard após um pequeno atraso
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);

    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getOriginName = (originSlug: string) => {
    switch (originSlug.toLowerCase()) {
      case "hotmart": return "Hotmart";
      case "perfectpay": return "Perfect Pay";
      case "kiwify": return "Kiwify";
      default: return "sua plataforma de compra";
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Ative seu Plano Started Gratuito!</h1>
      <p className={styles.description}>
        Parabéns pela sua compra do e-book na {getOriginName(origin)}! Insira o e-mail que você utilizou na compra para ativar seu acesso gratuito ao plano Started da CriptoPlay por 60 dias.
      </p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="email"
          placeholder={`Seu e-mail da ${getOriginName(origin)}`} // Placeholder dinâmico
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
          disabled={loading}
        />
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Verificando..." : "Ativar Plano Started"}
        </button>
      </form>
      {message && (
        <p className={`${styles.message} ${message.type === "success" ? styles.success : styles.error}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

export default function ResgatarBonusPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResgatarBonusPageContent />
    </Suspense>
  );
}