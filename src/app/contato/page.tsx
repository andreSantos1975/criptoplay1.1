"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "./contact.module.css";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Enviando...");

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus("Mensagem enviada com sucesso! Em breve entraremos em contato.");
        setFormData({ name: "", email: "", subject: "", message: "" }); // Clear form
      } else {
        setStatus("Ocorreu um erro ao enviar a mensagem. Tente novamente mais tarde.");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setStatus("Ocorreu um erro ao enviar a mensagem. Tente novamente mais tarde.");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Entre em Contato</h1>
        <p className={styles.subtitle}>
          Preencha o formulário abaixo e nossa equipe entrará em contato com você em breve.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            Nome Completo
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={styles.input}
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className={styles.input}
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="subject" className={styles.label}>
            Assunto
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            className={styles.input}
            value={formData.subject}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="message" className={styles.label}>
            Mensagem
          </label>
          <textarea
            id="message"
            name="message"
            className={styles.textarea}
            value={formData.message}
            onChange={handleChange}
            rows={5}
            required
          ></textarea>
        </div>

        <Button type="submit" className={styles.submitButton} disabled={status === "Enviando..."}>
          {status === "Enviando..." ? "Enviando..." : "Enviar Mensagem"}
        </Button>
        {status && <p className={styles.statusMessage}>{status}</p>}
      </form>
    </div>
  );
};

export default ContactPage;