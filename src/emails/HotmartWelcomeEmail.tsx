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

interface HotmartWelcomeEmailProps {
  accessLink: string;
  userName?: string;
  productName?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export const HotmartWelcomeEmail = ({
  accessLink,
  userName = 'Usuário',
  productName = 'nosso conteúdo exclusivo',
}: HotmartWelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bem-vindo à CriptoPlay!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/assets/logo.png`} // Adapte para o caminho do seu logo
          width="120"
          height="60"
          alt="CriptoPlay"
          style={logo}
        />
        <Text style={paragraph}>Olá, {userName},</Text>
        <Text style={paragraph}>
          Seja muito bem-vindo à CriptoPlay! Sua compra de <strong>{productName}</strong> na Hotmart liberou seu acesso à nossa plataforma.
        </Text>
        <Text style={paragraph}>
          Para começar, o último passo é criar sua senha de acesso. Clique no botão abaixo para definir sua senha e entrar na plataforma.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={accessLink}>
            Criar minha senha e acessar
          </Button>
        </Section>
        <Text style={paragraph}>
          Se o botão acima não funcionar, copie e cole o seguinte link no seu navegador:
        </Text>
        <Link href={accessLink} style={link}>
          {accessLink}
        </Link>
        <Text style={paragraph}>
          Este link é pessoal e intransferível e expira em 24 horas.
        </Text>
        <Text style={paragraph}>
          Nos vemos lá dentro!
          <br />A equipe CriptoPlay
        </Text>
      </Container>
    </Body>
  </Html>
);

export default HotmartWelcomeEmail;

// Estilos (reutilizados do PasswordResetEmail)
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
