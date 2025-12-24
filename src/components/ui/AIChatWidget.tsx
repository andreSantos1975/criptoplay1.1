"use client";

import { useChat } from '@ai-sdk/react';
import React, { useState, useRef, useEffect } from 'react';
import styles from './AIChatWidget.module.css';

export const AIChatWidget: React.FC = () => {
  const { messages, sendMessage, status } = useChat({
    onError: (error) => {
      console.error('[ChatWidget] Error:', error);
    },
    onFinish: (message) => {
      console.log('[ChatWidget] Finished message:', message);
    }
  });

  console.log('[ChatWidget] Messages:', messages);
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

  if (!isOpen) {
    return (
      <button className={styles.floatingButton} onClick={() => setIsOpen(true)}>
        Chat AI
      </button>
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
              // Ignorar outros tipos de partes, como tool-calls, por enquanto
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
