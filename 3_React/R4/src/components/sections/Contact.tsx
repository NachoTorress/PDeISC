import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaClipboard, FaCheck, FaArrowUp, FaEnvelope } from 'react-icons/fa';
import { education, profile } from '../../data/portfolio';
import { theme } from '../../styles/theme';

const ContactSection = styled.section`
  position: relative;
  overflow: hidden;
  min-height: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: ${theme.colors.textLight};
  padding: ${theme.spacing.lg} 0 ${theme.spacing.xl} 0;

  .container {
    position: relative;
    z-index: 2;
  }
`;

const SectionTitle = styled(motion.h2)`
  text-align: center;
  font-size: 2rem;
  margin-bottom: ${theme.spacing.lg};
  color: ${theme.colors.light};
  position: relative;

  @media (min-width: ${theme.breakpoints.md}) {
    font-size: 2.5rem;
  }

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
  width: min(100%, 760px);
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
  max-width: 58ch;
  margin: 0 auto ${theme.spacing.lg};
  font-size: 1rem;
  color: var(--color-muted);
  line-height: 1.8;

  @media (min-width: ${theme.breakpoints.md}) {
    font-size: 1.1rem;
  }
`;

const EmailBadge = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  width: fit-content;
  max-width: 100%;
  min-height: 48px;
  margin: ${theme.spacing.sm} auto ${theme.spacing.lg};
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${theme.colors.glass.border};
  padding: 0.65rem 1rem;
  border-radius: 10px;
  font-size: 1rem;
  line-height: 1.35;
  color: ${theme.colors.light};
  overflow-wrap: anywhere;
  word-break: break-word;
  transition: border-color ${theme.transitions.default}, background ${theme.transitions.default};

  &:hover {
    color: ${theme.colors.light};
    background: ${theme.colors.glass.card};
    border-color: ${theme.colors.accent};
  }

  svg {
    flex: 0 0 auto;
  }

  @media (max-width: 360px) {
    gap: 0.45rem;
    padding-inline: 0.7rem;
    font-size: 1rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};

  @media (max-width: 480px) {
    flex-direction: column;
    gap: ${theme.spacing.sm};

    > * {
      width: 100%;
      min-height: 48px;
    }
  }
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
  min-height: 48px;
  font-weight: 700;
  transition: all ${theme.transitions.default};

  &:hover {
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

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopyStatus('Email copiado al portapapeles.');
    } catch {
      setCopyStatus('El navegador no permitió copiar.');
    }
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus('Resumen copiado al portapapeles.');
    } catch {
      setCopyStatus('El navegador no permitió copiar.');
    }
  };

  return (
    <ContactSection id="contact" aria-label="Contacto">
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
            Podés ponerte en contacto conmigo a través de mi correo electrónico.
          </ContactText>

          <EmailBadge href={`mailto:${profile.email}`} aria-label={`Enviar correo a ${profile.email}`}>
            <FaEnvelope aria-hidden="true" />
            <span>{profile.email}</span>
          </EmailBadge>

          <ButtonGroup>
            <ContactButton type="button" variant="primary" onClick={copyEmail}>
              <FaClipboard aria-hidden="true" />
              Copiar Email
            </ContactButton>

            <ContactButton type="button" variant="secondary" onClick={copySummary}>
              {copyStatus.includes('Resumen') ? <FaCheck aria-hidden="true" /> : <FaClipboard aria-hidden="true" />}
              Copiar resumen
            </ContactButton>

            <ContactButton type="button" variant="secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
