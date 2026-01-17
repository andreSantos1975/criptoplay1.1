import { Suspense } from 'react';
import ResetPasswordPage from './form';
import styles from '../auth.module.css';

function ResetPasswordLoading() {
    return (
        <div className={styles.authContainer}>
            <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Carregando...</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Estamos verificando o seu link de redefinição de senha.
                </p>
            </div>
        </div>
    )
}

export default function Page() {
  return (
    <Suspense fallback={<ResetPasswordLoading/>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
