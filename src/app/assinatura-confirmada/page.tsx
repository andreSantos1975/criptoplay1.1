'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css'; // Importa o CSS Module
import { Button } from '@/components/ui/button'; // Mantém o import do Button

export default function AssinaturaConfirmadaPage() {
  useEffect(() => {
    console.log('Página de confirmação de assinatura carregada.');
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <svg
          className={styles.icon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <h1 className={styles.title}>
          Assinatura Confirmada!
        </h1>
        <p className={styles.paragraph}>
          Parabéns! Sua assinatura foi ativada com sucesso. Agradecemos por fazer parte da nossa comunidade.
        </p>
        <p className={styles.paragraph}>
          Você já pode aproveitar todos os benefícios do seu plano.
        </p>
        <Link href="/dashboard" passHref>
          <Button className={styles.button}> {/* Aplica a classe button do CSS Module */}
            Ir para o Dashboard
          </Button>
        </Link>
        <p className={styles.footerText}>
          Se tiver alguma dúvida, entre em contato com nosso{' '}
          <Link href="/suporte" className={styles.link}>
            suporte
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
