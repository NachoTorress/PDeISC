/**
 * In-card deletion confirmation component.
 * Minimalist, ultra-clean inline overlay for list items and cards in both Dark and Light modes.
 */
import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';

interface ConfirmDeleteCardProps {
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  compact?: boolean;
}

const OverlayBox = styled(motion.div)<{ compact?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(6px);
  border-radius: ${(props) => (props.compact ? '10px' : '16px')};
  display: flex;
  flex-direction: ${(props) => (props.compact ? 'row' : 'column')};
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => (props.compact ? '0.4rem 0.6rem' : '1.25rem')};
  text-align: ${(props) => (props.compact ? 'left' : 'center')};
  z-index: 50;
  border: 1.5px solid #ef4444;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
  gap: 0.4rem;

  [data-theme='light'] & {
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.15);
  }
`;

const QuestionText = styled.p<{ compact?: boolean }>`
  color: #f8fafc;
  font-weight: 700;
  font-size: ${(props) => (props.compact ? '0.8rem' : '0.95rem')};
  margin: 0;
  line-height: 1.2;
  word-break: break-word;
  overflow-wrap: anywhere;
  flex: 1;
  min-width: 0;

  [data-theme='light'] & {
    color: #0f172a;
  }
`;

const ButtonRow = styled.div<{ compact?: boolean }>`
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
`;

const ConfirmBtn = styled.button<{ compact?: boolean }>`
  background: #ef4444;
  color: #ffffff;
  border: none;
  padding: ${(props) => (props.compact ? '0.25rem 0.55rem' : '0.5rem 1.1rem')};
  border-radius: 999px;
  font-weight: 700;
  font-size: ${(props) => (props.compact ? '0.74rem' : '0.85rem')};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    background: #dc2626;
  }
`;

const CancelBtn = styled.button<{ compact?: boolean }>`
  background: rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: ${(props) => (props.compact ? '0.25rem 0.55rem' : '0.5rem 1.1rem')};
  border-radius: 999px;
  font-weight: 600;
  font-size: ${(props) => (props.compact ? '0.74rem' : '0.85rem')};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  [data-theme='light'] & {
    background: #f1f5f9;
    color: #334155;
    border-color: #cbd5e1;
  }

  &:hover {
    transform: translateY(-1px);

    [data-theme='light'] & {
      background: #e2e8f0;
    }
  }
`;

export const ConfirmDeleteCard: React.FC<ConfirmDeleteCardProps> = ({ onConfirm, onCancel, title, compact }) => {
  if (compact) {
    return (
      <OverlayBox compact initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
        <QuestionText compact>¿Eliminar {title ? `"${title}"` : 'este elemento'}?</QuestionText>
        <ButtonRow compact>
          <ConfirmBtn compact type="button" onClick={onConfirm}>
            Eliminar
          </ConfirmBtn>
          <CancelBtn compact type="button" onClick={onCancel}>
            Cancelar
          </CancelBtn>
        </ButtonRow>
      </OverlayBox>
    );
  }

  return (
    <OverlayBox initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
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
