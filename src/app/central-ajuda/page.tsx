"use client";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import styles from "./help.module.css";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: "Primeiros Passos",
    items: [
      {
        question: "O que é a CriptoPlay?",
        answer: "A CriptoPlay é uma plataforma completa para aprendizado e simulação de trading de criptomoedas. Oferecemos cursos educativos, simulador de mercado em tempo real e ferramentas de gestão financeira."
      },
      {
        question: "O simulador usa dinheiro real?",
        answer: "Não. O simulador utiliza um saldo virtual fictício para que você possa treinar suas estratégias sem risco financeiro. Os preços, no entanto, seguem o mercado real."
      },
      {
        question: "Como começo a operar?",
        answer: "Após criar sua conta, acesse o Simulador no menu principal. Você receberá um saldo inicial virtual para começar a fazer suas ordens de compra e venda."
      }
    ]
  },
  {
    title: "Conta e Segurança",
    items: [
      {
        question: "Como redefinir minha senha?",
        answer: "Na tela de login, clique em 'Esqueci minha senha'. Enviaremos um link de recuperação para o seu e-mail cadastrado."
      },
      {
        question: "É seguro conectar minha conta?",
        answer: "Sim. Utilizamos criptografia de ponta e não armazenamos dados sensíveis de pagamento diretamente em nossos servidores."
      }
    ]
  },
  {
    title: "Assinaturas e Pagamentos",
    items: [
      {
        question: "Quais são os métodos de pagamento aceitos?",
        answer: "Aceitamos cartões de crédito, PIX e algumas criptomoedas selecionadas através de nosso parceiro de pagamentos."
      },
      {
        question: "Como cancelo minha assinatura?",
        answer: "Você pode cancelar sua assinatura a qualquer momento acessando seu Perfil > Configurações > Assinatura."
      }
    ]
  }
];

export default function HelpCenterPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filteredData = faqData.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Central de Ajuda</h1>
        <p className={styles.subtitle}>Como podemos ajudar você hoje?</p>
      </header>

      <div className={styles.searchContainer}>
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Busque por dúvidas (ex: senha, simulador, pagamento)..." 
          className={styles.searchInput}
          style={{ paddingLeft: '3rem' }} // Inline override for icon space
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-8">
        {filteredData.length > 0 ? (
          filteredData.map((category, catIndex) => (
            <div key={catIndex}>
              <h2 className={styles.categoryTitle}>{category.title}</h2>
              <div className="space-y-3">
                {category.items.map((item, itemIndex) => {
                  const isOpen = openItems[`${catIndex}-${itemIndex}`];
                  return (
                    <div key={itemIndex} className={styles.faqItem}>
                      <button 
                        className={styles.question}
                        onClick={() => toggleItem(catIndex, itemIndex)}
                      >
                        <span>{item.question}</span>
                        <ChevronDown className={`${styles.icon} ${isOpen ? styles.open : ''}`} />
                      </button>
                      <div className={`${styles.answer} ${isOpen ? styles.open : ''}`}>
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400">
            Nenhum resultado encontrado para "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
}
