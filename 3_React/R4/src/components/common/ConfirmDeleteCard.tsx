/**
 * In-card deletion confirmation component.
 * Displays styled inline confirmation prompt inside item card without using native browser confirm().
 */
import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';

interface ConfirmDeleteCardProps {
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
}

const OverlayBox = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(20, 22, 34, 0.92);
  backdrop-filter: blur(6px);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.md};
  text-align: center;
  z-index: 10;
  border: 1px solid rgba(230, 57, 70, 0.5);
`;

const QuestionText = styled.p`
  color: ${theme.colors.light};
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: ${theme.spacing.md};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const ConfirmBtn = styled.button`
  background: #e63946;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
    background: #d62839;
  }
`;

const CancelBtn = styled.button`
  background: ${theme.colors.glass.card};
  color: ${theme.colors.textLight};
  border: 1px solid ${theme.colors.glass.border};
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

export const ConfirmDeleteCard: React.FC<ConfirmDeleteCardProps> = ({ onConfirm, onCancel, title }) => {
  return (
    <OverlayBox initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <QuestionText>¿Estás seguro que querés eliminar {title ? `"${title}"` : 'este elemento'}?</QuestionText>
      <ButtonRow>
        <ConfirmBtn type="button" onClick={onConfirm}>
          Sí, eliminar
        </ConfirmBtn>
        <CancelBtn type="button" onClick={onCancel}>
          Cancelar
        </CancelBtn>
      </ButtonRow>
    </OverlayBox>
  );
};
