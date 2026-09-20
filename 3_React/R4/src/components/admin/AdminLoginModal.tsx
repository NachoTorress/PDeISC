/**
 * Admin Login Modal Component.
 * Provides password authentication for unlocking portfolio management and CRUD features.
 */
import React, { useState } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { FaLock, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { FormField } from '../common/FormField';
import { theme } from '../../styles/theme';

const Backdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.md};
`;

const ModalCard = styled(motion.div)`
  background: ${theme.colors.glass.background};
  border: 1px solid ${theme.colors.glass.border};
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 440px;
  padding: ${theme.spacing.xl};
  position: relative;
  color: ${theme.colors.light};
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: ${theme.colors.textLight};
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 50%;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${theme.colors.light};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.lg};

  svg {
    color: ${theme.colors.accent};
    font-size: 1.6rem;
  }

  h3 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
  }
`;

const SubmitBtn = styled.button`
  width: 100%;
  background: ${theme.colors.gradient.accent};
  color: ${theme.colors.textDark};
  border: none;
  border-radius: 999px;
  padding: 0.8rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  margin-top: ${theme.spacing.md};
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ErrorAlert = styled.div`
  background: rgba(230, 57, 70, 0.15);
  border: 1px solid rgba(230, 57, 70, 0.4);
  color: #ff6b6b;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  font-size: 0.88rem;
  margin-bottom: ${theme.spacing.md};
`;

export const AdminLoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('Por favor ingresá la contraseña.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    const result = await login(password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.message || 'Contraseña incorrecta.');
    } else {
      setPassword('');
    }
  };

  return (
    <Backdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalCard initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <CloseButton onClick={closeLoginModal} aria-label="Cerrar modal">
          <FaTimes />
        </CloseButton>
        <Header>
          <FaLock />
          <h3>Acceso Administrador</h3>
        </Header>
        {errorMessage && <ErrorAlert role="alert">{errorMessage}</ErrorAlert>}
        <form onSubmit={handleSubmit}>
          <FormField
            id="admin-password"
            label="Contraseña del Administrador"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage('');
            }}
            required
          />
          <SubmitBtn type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
          </SubmitBtn>
        </form>
      </ModalCard>
    </Backdrop>
  );
};
