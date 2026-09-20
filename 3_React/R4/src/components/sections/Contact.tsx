import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaClipboard, FaCheck, FaArrowUp, FaEnvelope } from 'react-icons/fa';
import { education, profile } from '../../data/portfolio';
import { theme } from '../../styles/theme';

const ContactSection = styled.section`
  position: relative;
  overflow: hidden;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: ${theme.colors.textLight};
  padding: ${theme.spacing.xl} 0;

  .container {
    position: relative;
    z-index: 2;
  }
`;

const SectionTitle = styled(motion.h2)`
  text-align: center;
  font-size: clamp(2rem, 4vw, 2.5rem);
  margin-bottom: ${theme.spacing.lg};
  color: ${theme.colors.light};
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -${theme.spacing.md};
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 4px;
    background-color: ${theme.colors.accent};
    border-radius: 2px;
  }
`;

const ContactContent = styled(motion.article)`
  max-width: 760px;
  margin: ${theme.spacing.xl} auto 0;
  text-align: center;
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(8px);
  padding: ${theme.spacing.lg};
  border-radius: 20px;
  border: 1px solid ${theme.colors.glass.border};
  box-shadow: var(--shadow-card);

  @media (min-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing.xl};
  }
`;

const ContactText = styled.p`
  font-size: clamp(1rem, 2vw, 1.2rem);
  margin-bottom: ${theme.spacing.lg};
  color: var(--color-muted);
  line-height: 1.8;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const ContactButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  color: ${(props) => (props.variant === 'primary' ? theme.colors.textDark : theme.colors.textLight)};
  background: ${(props) => (props.variant === 'primary' ? theme.colors.gradient.accent : theme.colors.glass.card)};
  border: 1px solid ${(props) => (props.variant === 'primary' ? 'transparent' : theme.colors.glass.border)};
  border-radius: 999px;
  padding: 0.8rem 1.1rem;
  font-weight: 700;
  transition: all ${theme.transitions.default};

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card);
  }
`;

const ContactLink = styled.a<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  color: ${(props) => (props.variant === 'primary' ? theme.colors.textDark : theme.colors.textLight)};
  background: ${(props) => (props.variant === 'primary' ? theme.colors.gradient.accent : theme.colors.glass.card)};
  border: 1px solid ${(props) => (props.variant === 'primary' ? 'transparent' : theme.colors.glass.border)};
  border-radius: 999px;
  padding: 0.8rem 1.1rem;
  font-weight: 700;
  transition: all ${theme.transitions.default};

  &:hover {
    color: ${(props) => (props.variant === 'primary' ? theme.colors.textDark : theme.colors.textLight)};
    transform: translateY(-3px);
    box-shadow: var(--shadow-card);
  }
`;

const StatusText = styled.p`
  min-height: 1.5rem;
  margin: ${theme.spacing.md} 0 0;
  color: ${theme.colors.accent};
  font-weight: 600;
`;

const Contact = () => {
  const [copyStatus, setCopyStatus] = useState('');

  const summary = [
    ...education.map((item) => `${item.title}: ${item.description} ${item.meta ?? ''}`.trim()),
    `Email: ${profile.email}.`,
    'Intereses: C++, TypeScript, React, Node.js, Python, SQL, Git, Docker, Linux, algoritmos, IA y hardware.',
  ].join(' ');

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus('Resumen copiado.');
    } catch {
      setCopyStatus('El navegador no permitió copiar automáticamente.');
    }
  };

  return (
    <ContactSection id="contact" role="region" aria-label="Contacto">
      <div className="container">
        <SectionTitle
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Contacto
        </SectionTitle>
        <ContactContent
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <ContactText>
            Si querés contactarme, podés escribirme por mail. No se agregan redes sociales porque no fueron provistas.
          </ContactText>
          <ButtonGroup>
            <ContactLink href={`mailto:${profile.email}`} variant="primary">
              <FaEnvelope aria-hidden="true" />
              {profile.email}
            </ContactLink>
            <ContactButton type="button" variant="primary" onClick={copySummary}>
              {copyStatus ? <FaCheck aria-hidden="true" /> : <FaClipboard aria-hidden="true" />}
              Copiar resumen
            </ContactButton>
            <ContactButton type="button" onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}>
              <FaArrowUp aria-hidden="true" />
              Volver al inicio
            </ContactButton>
          </ButtonGroup>
          <StatusText role="status" aria-live="polite">
            {copyStatus}
          </StatusText>
        </ContactContent>
      </div>
    </ContactSection>
  );
};

export default Contact;
