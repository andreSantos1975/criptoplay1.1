"use client";

// import { useChat } from '@ai-sdk/react'; // Removido por falha crítica
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './AIChatWidget.module.css';

// Definição manual de tipos para compatibilidade
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  parts: { type: 'text'; text: string }[];
};

export const AIChatWidget: React.FC = () => {
  const { data: session } = useSession();
  
  // Estado manual
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localInput, setLocalInput] = useState('');
  
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const submitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;

    const userText = localInput;
    setLocalInput('');
    setIsLoading(true);

    // Adiciona mensagem do usuário
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      parts: [{ type: 'text', text: userText }]
    };
    
    // Adiciona mensagem placeholder da IA
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsgPlaceholder: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      parts: [{ type: 'text', text: '' }]
    };

    setMessages(prev => [...prev, userMsg, aiMsgPlaceholder]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.parts[0].text
          }))
        }),
      });

      if (!response.ok) {
        // Handle rate-limiting errors specifically
        if (response.status === 429) {
          const errorData = await response.json();
          setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId 
              ? { ...msg, parts: [{ type: 'text', text: errorData.error || "Você atingiu seu limite de uso." }] }
              : msg
          ));
        } else {
          // For other errors, throw to be caught by the generic catch block
          throw new Error(response.statusText);
        }
        setIsLoading(false);
        return; // Stop further execution
      }

      if (!response.body) throw new Error('Sem corpo de resposta');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;
        
        // Atualiza a UI progressivamente
        setMessages(prev => prev.map(msg => 
          msg.id === aiMsgId 
            ? { ...msg, parts: [{ type: 'text', text: aiText }] }
            : msg
        ));
      }

    } catch (error) {
      console.error('[ChatWidget] Erro fetch:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
          ? { ...msg, parts: [{ type: 'text', text: "Erro ao conectar com a IA. Tente novamente." }] }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
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
        Assistente Cripto
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
          <Link href="/precos" className={styles.upgradeButton}>
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
      <form onSubmit={submitMessage} className={styles.inputForm}>
        <input
          className={styles.textInput}
          value={localInput}
          placeholder="Diga algo..."
          onChange={(e) => setLocalInput(e.target.value)}
        />
        <button type="submit" className={styles.sendButton} disabled={isLoading}>
          Enviar
        </button>
      </form>
    </div>
  );
};
