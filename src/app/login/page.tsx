
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.')
      } else {
        setSuccess('Login bem-sucedido! Redirecionando...')
        setTimeout(() => {
          router.push('/')
          router.refresh() // To update session state in Navbar
        }, 1000) // Pequeno atraso para o usuário ver a mensagem
      }
    } catch (err) {
      setError('Ocorreu um erro ao fazer login.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1 className={styles.title}>Entrar</h1>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="password">Senha</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Login'}
        </button>
        <p className={styles.registerLink}>
          Não tem uma conta? <a href="/cadastro">Cadastre-se aqui</a>
        </p>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
      </form>
    </div>
  )
}
