import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Link,
} from "@react-email/components";
import * as React from "react";

interface PriceAlertEmailProps {
  symbol: string;
  price: number;
  targetPrice: number;
  operator: "gt" | "lt";
  userName?: string;
}

export const PriceAlertEmail = ({
  symbol,
  price,
  targetPrice,
  operator,
  userName = "Investidor",
}: PriceAlertEmailProps) => {
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);

  const formattedTarget = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(targetPrice);

  const directionText = operator === "gt" ? "subiu acima de" : "caiu abaixo de";

  return (
    <Html>
      <Head />
      <Preview>
        O preço de {symbol} atingiu seu alvo de {formattedTarget}!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Alerta de Preço: {symbol}</Heading>
          <Text style={text}>Olá, {userName}!</Text>
          <Text style={text}>
            O seu alerta para <strong>{symbol}</strong> foi disparado.
          </Text>
          <Section style={highlightSection}>
            <Text style={highlightText}>
              O preço atual é <strong>{formattedPrice}</strong>
            </Text>
            <Text style={subHighlightText}>
              (Alvo: {directionText} {formattedTarget})
            </Text>
          </Section>
          <Text style={text}>
            Acesse a plataforma agora para analisar o mercado e tomar suas
            decisões.
          </Text>
          <Button style={button} href="https://criptoplay.com.br/dashboard">
            Ir para o Dashboard
          </Button>
          <Hr style={hr} />
          <Text style={footer}>
            Este é um e-mail automático do sistema CriptoPlay.
            <br />
            <Link href="https://criptoplay.com.br" style={link}>
              CriptoPlay.com.br
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default PriceAlertEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
  padding: "0 48px",
};

const highlightSection = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  margin: "24px 48px",
  padding: "24px",
  textAlign: "center" as const,
  border: "1px solid #bbf7d0",
};

const highlightText = {
  color: "#166534",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const subHighlightText = {
  color: "#15803d",
  fontSize: "14px",
  margin: "8px 0 0",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "200px",
  padding: "12px",
  margin: "32px auto",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
};

const link = {
  color: "#8898aa",
  textDecoration: "underline",
};
