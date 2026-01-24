export type ChapterStatus = "completed" | "available" | "locked" | "coming";

export interface Chapter {
  id: number;
  title: string;
  description: string;
  status: ChapterStatus;
  slug?: string;
  category?: "beginner" | "intermediate" | "advanced";
}

// Existing chapters (active)
export const existingChapters: Chapter[] = [
  {
    id: 1,
    title: "Exchanges de Criptomoedas",
    description:
      "Entenda como funcionam as corretoras de criptomoedas e escolha a melhor para seu perfil.",
    status: "completed",
    category: "beginner",
  },
  {
    id: 2,
    title: "Hardware Wallet",
    description:
      "Aprenda a proteger suas criptomoedas com carteiras físicas de máxima segurança.",
    status: "completed",
    category: "beginner",
  },
  {
    id: 3,
    title: "Hot Wallets (Carteiras Quentes)",
    description:
      "Conheça as carteiras digitais para uso diário e suas melhores práticas.",
    status: "available",
    category: "beginner",
  },
  {
    id: 4,
    title: "ETF e Fundos de Investimentos",
    description:
      "Explore alternativas de investimento em cripto através de ETFs e fundos.",
    status: "available",
    category: "beginner",
  },
  {
    id: 5,
    title: "Regulamentação e Conformidade",
    description:
      "Entenda o cenário regulatório das criptomoedas no Brasil e no mundo.",
    status: "available",
    category: "beginner",
  },
  {
    id: 6,
    title: "Tributação de Criptomoedas no Brasil",
    description:
      "Aprenda a declarar e pagar impostos sobre seus ganhos com criptomoedas.",
    status: "available",
    category: "beginner",
  },
  {
    id: 7,
    title: "Psicologia do Investidor",
    description:
      "Domine suas emoções e evite armadilhas psicológicas no mercado cripto.",
    status: "locked",
    category: "beginner",
  },
  {
    id: 8,
    title: "Gerenciamento de Risco",
    description:
      "Técnicas profissionais para proteger seu capital e maximizar retornos.",
    status: "locked",
    category: "beginner",
  },
  {
    id: 9,
    title: "Qual Criptomoeda Comprar?",
    description:
      "Critérios e metodologias para selecionar as melhores criptomoedas.",
    status: "locked",
    category: "beginner",
  },
  {
    id: 10,
    title: "Teste de Perfil do Investidor",
    description:
      "Descubra seu perfil de risco e crie uma estratégia personalizada.",
    status: "locked",
    category: "beginner",
  },
  {
    id: 11,
    title: "Lista de Criptomoedas Mais Seguras",
    description:
      "Conheça os ativos digitais com maior segurança e estabilidade.",
    status: "locked",
    category: "beginner",
  },
  {
    id: 12,
    title: "Lista de Criptomoedas Mais Arriscadas",
    description:
      "Entenda os riscos e oportunidades de ativos altamente voláteis.",
    status: "locked",
    category: "beginner",
  },
  {
    id: 13,
    title: "Como Usar a Carteira MetaMask",
    description:
      "Tutorial completo para configurar e usar a carteira mais popular do mercado.",
    status: "locked",
    category: "beginner",
  },
];

// Coming soon chapters (Intermediate)
export const comingChapters: Chapter[] = [
  {
    id: 14,
    title: "Análise Fundamentalista de Criptomoedas",
    description:
      "Avalie projetos cripto com metodologia profissional e fundamentos sólidos.",
    status: "coming",
    category: "intermediate",
  },
  {
    id: 15,
    title: "Introdução ao DeFi",
    description:
      "Explore o universo das finanças descentralizadas e suas oportunidades.",
    status: "coming",
    category: "intermediate",
  },
  {
    id: 16,
    title: "Renda Passiva com Cripto",
    description:
      "Estratégias para gerar renda passiva com staking, yield farming e mais.",
    status: "coming",
    category: "intermediate",
  },
  {
    id: 17,
    title: "Introdução a NFTs e Web3",
    description:
      "Entenda o ecossistema de tokens não-fungíveis e a nova internet.",
    status: "coming",
    category: "intermediate",
  },
  {
    id: 18,
    title: "Estratégias de Longo Prazo",
    description:
      "Construa uma carteira sólida com visão de longo prazo e disciplina.",
    status: "coming",
    category: "intermediate",
  },
  {
    id: 19,
    title: "Segurança Avançada e Custódia",
    description:
      "Proteja seus ativos com técnicas avançadas de segurança e custódia.",
    status: "coming",
    category: "intermediate",
  },
  {
    id: 20,
    title: "Planejamento Financeiro com Cripto",
    description:
      "Integre criptomoedas ao seu planejamento financeiro pessoal.",
    status: "coming",
    category: "intermediate",
  },
  /* {
    id: 21,
    title: "Cripto + Inteligência Artificial",
    description:
      "Descubra como IA está transformando o mercado de criptomoedas.",
    status: "coming",
    category: "intermediate",
  }, */
];

// Advanced chapters (Coming soon)
export const advancedChapters: Chapter[] = [
  {
    id: 22,
    title: "Masterclass de Futuros e Alavancagem",
    description:
      "Operações perpétuas, funding rates e gestão de margem.",
    status: "coming",
    category: "advanced",
  },
  {
    id: 23,
    title: "Análise On-Chain",
    description:
      "Interpretando dados direto da blockchain e fluxo de baleias.",
    status: "coming",
    category: "advanced",
  },
  {
    id: 24,
    title: "DeFi Avançado e Liquidez",
    description:
      "Yield Farming, Impermanent Loss e Piscinas de Liquidez.",
    status: "coming",
    category: "advanced",
  },
  {
    id: 25,
    title: "Tokenomics e Engenharia Econômica",
    description:
      "Análise de vesting, inflação e distribuição de tokens.",
    status: "coming",
    category: "advanced",
  },
  {
    id: 26,
    title: "Auditoria de Smart Contracts",
    description:
      "Segurança básica e identificação de riscos no código.",
    status: "coming",
    category: "advanced",
  },
  {
    id: 27,
    title: "Estratégias com Opções (Hedge)",
    description:
      "Proteção de carteira e especulação avançada.",
    status: "coming",
    category: "advanced",
  },
  {
    id: 28,
    title: "Psicologia de Trading Profissional",
    description:
      "Mindset para alta performance e gestão emocional avançada.",
    status: "coming",
    category: "advanced",
  },
];

export const allChapters = [...existingChapters, ...comingChapters, ...advancedChapters];
