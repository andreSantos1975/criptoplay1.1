"use client";

import { useChat } from '@ai-sdk/react';
import React, { useState } from 'react';
import styles from './AIChatWidget.module.css';

export const AIChatWidget: React.FC = () => {
  const { messages, sendMessage, status } = useChat({});
  const isLoading = status === 'submitted' || status === 'streaming';
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

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
            {m.parts.filter(p => p.type === 'text').map(p => (p as any).text).join('')}
          </div>
        ))}
        {isLoading && <div className={styles.loadingMessage}>Digitando...</div>}
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
