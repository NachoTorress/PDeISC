/**
 * In-card deletion confirmation component.
 * Compact, responsive overlay styled cleanly for both Dark and Light modes.
 * Adapts layout dynamically based on container height (compact mode for small items like skills).
 */
import React from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { FaExclamationTriangle } from 'react-icons/fa';

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
  background: var(--confirm-bg, #0f172a);
  backdrop-filter: blur(8px);
  border-radius: ${(props) => (props.compact ? '10px' : '16px')};
  display: flex;
  flex-direction: ${(props) => (props.compact ? 'row' : 'column')};
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => (props.compact ? '0.4rem 0.75rem' : '1.25rem')};
  text-align: ${(props) => (props.compact ? 'left' : 'center')};
  z-index: 50;
  border: 2px solid #ef4444;
  box-shadow: 0 4px 18px rgba(239, 68, 68, 0.25);
  gap: 0.5rem;

  [data-theme='light'] & {
    background: #ffffff;
    box-shadow: 0 4px 18px rgba(239, 68, 68, 0.15);
  }
`;

const ContentGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
`;

const WarningIcon = styled.div<{ compact?: boolean }>`
  width: ${(props) => (props.compact ? '26px' : '40px')};
  height: ${(props) => (props.compact ? '26px' : '40px')};
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => (props.compact ? '0.85rem' : '1.25rem')};
  flex-shrink: 0;
  margin-bottom: ${(props) => (props.compact ? '0' : '0.5rem')};
`;

const QuestionText = styled.p<{ compact?: boolean }>`
  color: var(--confirm-text, #f8fafc);
  font-weight: 700;
  font-size: ${(props) => (props.compact ? '0.82rem' : '0.95rem')};
  margin-bottom: ${(props) => (props.compact ? '0' : '1rem')};
  line-height: 1.3;
  white-space: ${(props) => (props.compact ? 'nowrap' : 'normal')};
  text-overflow: ellipsis;
  overflow: hidden;

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
  padding: ${(props) => (props.compact ? '0.25rem 0.65rem' : '0.5rem 1.1rem')};
  border-radius: 999px;
  font-weight: 700;
  font-size: ${(props) => (props.compact ? '0.78rem' : '0.85rem')};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);

  &:hover {
    transform: translateY(-1px);
    background: #dc2626;
  }
`;

const CancelBtn = styled.button<{ compact?: boolean }>`
  background: rgba(148, 163, 184, 0.15);
  color: var(--cancel-text, #cbd5e1);
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: ${(props) => (props.compact ? '0.25rem 0.65rem' : '0.5rem 1.1rem')};
  border-radius: 999px;
  font-weight: 600;
  font-size: ${(props) => (props.compact ? '0.78rem' : '0.85rem')};
  cursor: pointer;
  transition: all 0.2s ease;

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
        <ContentGroup>
          <WarningIcon compact>
            <FaExclamationTriangle />
          </WarningIcon>
          <QuestionText compact>¿Eliminar {title ? `"${title}"` : ''}?</QuestionText>
        </ContentGroup>
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
