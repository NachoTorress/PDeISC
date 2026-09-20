/**
 * In-card deletion confirmation component.
 * Theme-aware overlay card styled cleanly for both Dark and Light modes.
 */
import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { FaExclamationTriangle } from 'react-icons/fa';

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
  background: var(--confirm-bg, #0f172a);
  backdrop-filter: blur(8px);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.25rem;
  text-align: center;
  z-index: 50;
  border: 2px solid #ef4444;
  box-shadow: 0 10px 25px rgba(239, 68, 68, 0.25);

  [data-theme='light'] & {
    background: #ffffff;
    box-shadow: 0 10px 25px rgba(239, 68, 68, 0.15);
  }
`;

const WarningIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
`;

const QuestionText = styled.p`
  color: var(--confirm-text, #f8fafc);
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.4;

  [data-theme='light'] & {
    color: #0f172a;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const ConfirmBtn = styled.button`
  background: #ef4444;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

  &:hover {
    transform: translateY(-2px);
    background: #dc2626;
    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.45);
  }
`;

const CancelBtn = styled.button`
  background: rgba(148, 163, 184, 0.15);
  color: var(--cancel-text, #cbd5e1);
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;

  [data-theme='light'] & {
    background: #f1f5f9;
    color: #334155;
    border-color: #cbd5e1;
  }

  &:hover {
    transform: translateY(-2px);
    background: rgba(148, 163, 184, 0.3);

    [data-theme='light'] & {
      background: #e2e8f0;
    }
  }
`;

export const ConfirmDeleteCard: React.FC<ConfirmDeleteCardProps> = ({ onConfirm, onCancel, title }) => {
  return (
    <OverlayBox initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <WarningIcon>
        <FaExclamationTriangle />
      </WarningIcon>
      <QuestionText>¿Eliminar {title ? `"${title}"` : 'este elemento'}?</QuestionText>
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
