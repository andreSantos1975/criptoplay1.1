import {
  Html,
  Body,
  Head,
  Heading,
  Container,
  Text,
  Section,
  Hr,
  Preview,
} from '@react-email/components';

interface ContactFormEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const ContactFormEmail = ({
  name,
  email,
  subject,
  message,
}: ContactFormEmailProps) => (
  <Html>
    <Head />
    <Preview>Nova mensagem do formulário de contato da CriptoPlay</Preview>
    <Body style={{ backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      <Container style={{
        margin: '40px auto',
        padding: '20px',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
      }}>
        <Heading style={{
          color: '#1f2937',
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          Nova Mensagem de Contato
        </Heading>

        <Section style={{ marginTop: '20px' }}>
          <Text style={{ fontSize: '16px', color: '#374151' }}>
            Você recebeu uma nova mensagem através do formulário de contato do site CriptoPlay.
          </Text>

          <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />

          <Heading as="h2" style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            Detalhes do Contato:
          </Heading>
          
          <Text><strong>Nome:</strong> {name}</Text>
          <Text><strong>Email:</strong> {email}</Text>
          
          <Hr style={{ borderColor: '#e5e7eb', margin: '20px 0' }} />

          <Heading as="h2" style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            Mensagem:
          </Heading>
          <Text><strong>Assunto:</strong> {subject}</Text>
          <Text style={{
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#374151',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
            border: '1px solid #e5e7eb'
          }}>
            {message}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ContactFormEmail;
