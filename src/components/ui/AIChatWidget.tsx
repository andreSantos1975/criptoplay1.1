"use client";

import { useChat } from '@ai-sdk/react';
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './AIChatWidget.module.css';

export const AIChatWidget: React.FC = () => {
  const { data: session } = useSession();
  const { messages, sendMessage, status } = useChat({
    onError: (error) => {
      console.error('[ChatWidget] Error:', error);
    },
    onFinish: (message) => {
      console.log('[ChatWidget] Finished message:', message);
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage({ text: input });
    setInput('');
  };

  // Verifica se o usuário tem assinatura ativa ou está no período de trial
  const isTrialActive = session?.user?.trialEndsAt ? new Date(session.user.trialEndsAt) > new Date() : false;

  const hasAccess = 
    session?.user?.isAdmin || 
    session?.user?.subscriptionStatus === 'authorized' || 
    session?.user?.subscriptionStatus === 'lifetime' ||
    isTrialActive;

  if (!isOpen) {
    return (
      <button className={styles.floatingButton} onClick={() => setIsOpen(true)}>
        Chat AI
      </button>
    );
  }

  // Se não tiver acesso, mostra o overlay de bloqueio
  if (!hasAccess) {
    const trialEnded = session?.user?.trialEndsAt && new Date(session.user.trialEndsAt) <= new Date();
    return (
      <div className={styles.chatContainer}>
        <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
          X
        </button>
        <div className={styles.lockedContainer}>
          <div className={styles.lockedIcon}>🔒</div>
          <h3 className={styles.lockedTitle}>Funcionalidade Premium</h3>
          <p className={styles.lockedText}>
            {trialEnded
              ? "Seu período de teste Premium gratuito terminou. Assine um plano para continuar usando o Chatbot IA."
              : "O Chatbot IA é exclusivo para assinantes Starter, Pro ou Premium."
            }
          </p>
          <Link href="/assinatura" className={styles.upgradeButton}>
            Ver Planos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
        X
      </button>
      <div className={styles.messagesContainer}>
        {messages.length === 0 && <p className={styles.welcomeMessage}>Olá! Como posso ajudar com sua jornada cripto?</p>}
        {messages.map((m) => (
          <div key={m.id} className={`${styles.message} ${m.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
            <strong>{m.role === 'user' ? 'Você: ' : 'AI: '}</strong>
            {m.parts.map((part, index) => {
              if (part.type === 'text') {
                return <span key={index}>{part.text}</span>;
              }
              return null;
            })}
          </div>
        ))}
        {isLoading && (
          <div className={styles.typingIndicator}>
            <div className={styles.typingDot}></div>
            <div className={styles.typingDot}></div>
            <div className={styles.typingDot}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          className={styles.textInput}
          value={input}
          placeholder="Diga algo..."
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button type="submit" className={styles.sendButton} disabled={isLoading}>
          Enviar
        </button>
      </form>
    </div>
  );
};
