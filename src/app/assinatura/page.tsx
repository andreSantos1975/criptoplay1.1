import { Suspense } from 'react';
import AssinaturaClientPage from './AssinaturaClientPage';

export default function AssinaturaPage() {
  return (
    <Suspense fallback={<div>Carregando página de assinatura...</div>}>
      <AssinaturaClientPage />
    </Suspense>
  );
}
