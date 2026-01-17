'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setError('Token de redefinição não encontrado ou inválido.');
      toast({
        title: 'Erro',
        description: 'O link de redefinição de senha é inválido ou expirou.',
        variant: 'destructive',
      });
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/redefinir-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Não foi possível redefinir a senha.');
      }

      toast({
        title: 'Sucesso!',
        description: 'Sua senha foi redefinida. Você já pode fazer login com a nova senha.',
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className={styles.authContainer}>
        <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Senha Redefinida!</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sua senha foi alterada com sucesso. Você será redirecionado para a página de login.
          </p>
          <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Ir para o login agora
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className={styles.authContainer}>
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crie sua nova senha</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Escolha uma senha forte e segura.
          </p>
        </div>
        
        {error ? (
           <div className="text-center text-red-500">
             <p>{error}</p>
             <Link href="/auth/recuperar-senha"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Solicitar um novo link
             </Link>
           </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nova Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="********"
              />
            </div>
            <div>
              <label htmlFor="confirm-password"
                     className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar Nova Senha
              </label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                placeholder="********"
              />
            </div>
            <div>
              <Button type="submit" className="w-full" disabled={loading || !token}>
                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}