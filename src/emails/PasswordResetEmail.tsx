import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import React from 'react';

interface PasswordResetEmailProps {
  resetLink?: string;
  userName?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const PasswordResetEmail = ({
  resetLink = `${baseUrl}/auth/redefinir-senha?token=mock-token`,
  userName = 'Usuário',
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>CriptoPlay - Redefinição de Senha</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="hero-crypto.jpg"
          width="120"
          height="60"
          alt="CriptoPlay"
          style={logo}
        />
        <Text style={paragraph}>Olá, {userName},</Text>
        <Text style={paragraph}>
          Recebemos uma solicitação para redefinir a senha da sua conta na CriptoPlay.
          Se você não fez essa solicitação, pode ignorar este e-mail com segurança.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={resetLink}>
            Redefinir minha senha
          </Button>
        </Section>
        <Text style={paragraph}>
          Se o botão acima não funcionar, copie e cole o seguinte link no seu navegador:
        </Text>
        <Link href={resetLink} style={link}>
          {resetLink}
        </Link>
        <Text style={paragraph}>
          Este link de redefinição de senha expirará em 1 hora.
        </Text>
        <Text style={paragraph}>
          Atenciosamente,
          <br />A equipe CriptoPlay
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const logo = {
  margin: '0 auto',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 20px',
};

const btnContainer = {
  textAlign: 'center' as const,
  padding: '12px 0',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  padding: '12px 20px',
};

const link = {
  color: '#007bff',
  wordBreak: 'break-all' as const,
  padding: '0 20px',
};
