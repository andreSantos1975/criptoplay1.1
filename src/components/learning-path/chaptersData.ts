export type ChapterStatus = "completed" | "available" | "locked" | "coming";

export interface Chapter {
  id: number;
  title: string;
  description: string;
  status: ChapterStatus;
  slug?: string;
}

// Existing chapters (active)
export const existingChapters: Chapter[] = [
  {
    id: 1,
    title: "Exchanges de Criptomoedas",
    description:
      "Entenda como funcionam as corretoras de criptomoedas e escolha a melhor para seu perfil.",
    status: "completed",
  },
  {
    id: 2,
    title: "Hardware Wallet",
    description:
      "Aprenda a proteger suas criptomoedas com carteiras físicas de máxima segurança.",
    status: "completed",
  },
  {
    id: 3,
    title: "Hot Wallets (Carteiras Quentes)",
    description:
      "Conheça as carteiras digitais para uso diário e suas melhores práticas.",
    status: "available",
  },
  {
    id: 4,
    title: "ETF e Fundos de Investimentos",
    description:
      "Explore alternativas de investimento em cripto através de ETFs e fundos.",
    status: "available",
  },
  {
    id: 5,
    title: "Regulamentação e Conformidade",
    description:
      "Entenda o cenário regulatório das criptomoedas no Brasil e no mundo.",
    status: "available",
  },
  {
    id: 6,
    title: "Tributação de Criptomoedas no Brasil",
    description:
      "Aprenda a declarar e pagar impostos sobre seus ganhos com criptomoedas.",
    status: "available",
  },
  {
    id: 7,
    title: "Psicologia do Investidor",
    description:
      "Domine suas emoções e evite armadilhas psicológicas no mercado cripto.",
    status: "locked",
  },
  {
    id: 8,
    title: "Gerenciamento de Risco",
    description:
      "Técnicas profissionais para proteger seu capital e maximizar retornos.",
    status: "locked",
  },
  {
    id: 9,
    title: "Qual Criptomoeda Comprar?",
    description:
      "Critérios e metodologias para selecionar as melhores criptomoedas.",
    status: "locked",
  },
  {
    id: 10,
    title: "Teste de Perfil do Investidor",
    description:
      "Descubra seu perfil de risco e crie uma estratégia personalizada.",
    status: "locked",
  },
  {
    id: 11,
    title: "Lista de Criptomoedas Mais Seguras",
    description:
      "Conheça os ativos digitais com maior segurança e estabilidade.",
    status: "locked",
  },
  {
    id: 12,
    title: "Lista de Criptomoedas Mais Arriscadas",
    description:
      "Entenda os riscos e oportunidades de ativos altamente voláteis.",
    status: "locked",
  },
  {
    id: 13,
    title: "Como Usar a Carteira MetaMask",
    description:
      "Tutorial completo para configurar e usar a carteira mais popular do mercado.",
    status: "locked",
  },
];

// Coming soon chapters
export const comingChapters: Chapter[] = [
  {
    id: 14,
    title: "Análise Fundamentalista de Criptomoedas",
    description:
      "Avalie projetos cripto com metodologia profissional e fundamentos sólidos.",
    status: "coming",
  },
  {
    id: 15,
    title: "Introdução ao DeFi",
    description:
      "Explore o universo das finanças descentralizadas e suas oportunidades.",
    status: "coming",
  },
  {
    id: 16,
    title: "Renda Passiva com Cripto",
    description:
      "Estratégias para gerar renda passiva com staking, yield farming e mais.",
    status: "coming",
  },
  {
    id: 17,
    title: "Introdução a NFTs e Web3",
    description:
      "Entenda o ecossistema de tokens não-fungíveis e a nova internet.",
    status: "coming",
  },
  {
    id: 18,
    title: "Estratégias de Longo Prazo",
    description:
      "Construa uma carteira sólida com visão de longo prazo e disciplina.",
    status: "coming",
  },
  {
    id: 19,
    title: "Segurança Avançada e Custódia",
    description:
      "Proteja seus ativos com técnicas avançadas de segurança e custódia.",
    status: "coming",
  },
  {
    id: 20,
    title: "Planejamento Financeiro com Cripto",
    description:
      "Integre criptomoedas ao seu planejamento financeiro pessoal.",
    status: "coming",
  },
  {
    id: 21,
    title: "Cripto + Inteligência Artificial",
    description:
      "Descubra como IA está transformando o mercado de criptomoedas.",
    status: "coming",
  },
];

export const allChapters = [...existingChapters, ...comingChapters];
