'use client';

import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

// --- Definição dos Planos ---
const PLANS = {
  anual_promo: {
    planId: 'criptoplay-anual-promo-99',
    planName: 'Plano Anual (Promocional)',
    amount: 99.9,
    description: 'Oferta exclusiva para leitores do eBook. Acesso completo por um ano.',
    planType: 'ANNUAL',
  },
  anual_regular: {
    planId: 'criptoplay-anual-regular-199',
    planName: 'Plano Anual',
    amount: 199.9,
    description: 'Acesso completo a todas as funcionalidades da plataforma por um ano.',
    planType: 'ANNUAL',
  },
};

const DEFAULT_PLAN_KEY = 'anual_regular';

// --- Inicialização do Mercado Pago ---
const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
if (publicKey) {
  initMercadoPago(publicKey, { locale: 'pt-BR' });
} else {
  console.error('Mercado Pago Public Key not found. Please set NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY in your .env.local file.');
}

const AssinaturaClientPage = () => {
  const searchParams = useSearchParams();
  
  // Determina o plano de forma síncrona para evitar "flicker" de preço
  const offerKey = searchParams.get('oferta');
  const currentPlan = (offerKey && offerKey in PLANS)
    ? PLANS[offerKey as keyof typeof PLANS]
    : PLANS[DEFAULT_PLAN_KEY];

  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payerEmail, setPayerEmail] = useState('');

  const handleCreatePreference = async () => {
    if (!payerEmail) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreferenceId(null);

    const planDetails = {
      ...currentPlan,
      payerEmail: payerEmail,
    };

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planDetails),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Falha ao criar a preferência de pagamento.');
      }

      if (data.preferenceId) {
        setPreferenceId(data.preferenceId);
      } else {
        throw new Error('ID da preferência não foi retornado do backend.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1>Finalize sua Assinatura</h1>
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2>{currentPlan.planName}</h2>
        <p>{currentPlan.description}</p>
        <p style={{ fontSize: '2em', fontWeight: 'bold', color: '#333' }}>
          R$ {currentPlan.amount.toFixed(2).replace('.', ',')} / ano
        </p>
      </div>

      {!preferenceId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
          <p>Digite seu e-mail de pagamento:</p>
          <input
            type="email"
            value={payerEmail}
            onChange={(e) => setPayerEmail(e.target.value)}
            placeholder="seu.email@exemplo.com"
            style={{ padding: '10px', width: '80%', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button
            onClick={handleCreatePreference}
            disabled={isLoading || !payerEmail}
            style={{ padding: '12px 24px', cursor: 'pointer', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '4px', fontSize: '16px' }}
          >
            {isLoading ? 'Gerando...' : 'Confirmar e Gerar Pagamento'}
          </button>
        </div>
      )}

      {isLoading && <p>Carregando...</p>}
      {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
      
      {preferenceId && (
        <div style={{border: '1px solid #eee', padding: '20px', borderRadius: '6px'}}>
          <p>Pagamento para: <strong>{payerEmail}</strong></p>
          <Wallet
            initialization={{ preferenceId: preferenceId }}
          />
          <button 
            onClick={() => { setPreferenceId(null); setError(null); }} 
            style={{marginTop: '20px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer'}}
          >
            Alterar plano ou e-mail
          </button>
        </div>
      )}
    </div>
  );
};

export default AssinaturaClientPage;
