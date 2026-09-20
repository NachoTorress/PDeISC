/**
 * Reusable Accessible Form Field Component with real-time validation error rendering.
 * Enforces explicit <label> element and distinct red input styling on validation failure.
 */
import React from 'react';
import styled from '@emotion/styled';
import { theme } from '../../styles/theme';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'password' | 'textarea';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  errorMessage?: string;
  isValid?: boolean;
  required?: boolean;
  rows?: number;
}

const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${theme.spacing.md};
  text-align: left;
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
  color: ${theme.colors.light};
`;

const Input = styled.input<{ isInvalid?: boolean }>`
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  background: var(--input-background);
  color: ${theme.colors.textLight};
  border: 1.5px solid ${(props) => (props.isInvalid ? '#e63946' : theme.colors.glass.border)};
  outline: none;
  transition: all ${theme.transitions.default};

  &:focus {
    border-color: ${(props) => (props.isInvalid ? '#e63946' : theme.colors.accent)};
    box-shadow: 0 0 0 3px ${(props) => (props.isInvalid ? 'rgba(230, 57, 70, 0.25)' : 'rgba(246, 177, 122, 0.25)')};
  }
`;

const TextArea = styled.textarea<{ isInvalid?: boolean }>`
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  background: var(--input-background);
  color: ${theme.colors.textLight};
  border: 1.5px solid ${(props) => (props.isInvalid ? '#e63946' : theme.colors.glass.border)};
  outline: none;
  resize: vertical;
  transition: all ${theme.transitions.default};

  &:focus {
    border-color: ${(props) => (props.isInvalid ? '#e63946' : theme.colors.accent)};
    box-shadow: 0 0 0 3px ${(props) => (props.isInvalid ? 'rgba(230, 57, 70, 0.25)' : 'rgba(246, 177, 122, 0.25)')};
  }
`;

const ErrorText = styled.span`
  color: #ff4d4d;
  font-size: 0.82rem;
  font-weight: 600;
  margin-top: 0.3rem;
`;

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  errorMessage,
  isValid = true,
  required = false,
  rows = 3,
}) => {
  const isInvalid = isValid === false || Boolean(errorMessage);

  return (
    <FieldContainer>
      <Label htmlFor={id}>
        {label} {required && <span style={{ color: '#e63946' }}>*</span>}
      </Label>
      {type === 'textarea' ? (
        <TextArea
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          isInvalid={isInvalid}
          rows={rows}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? `${id}-error` : undefined}
        />
      ) : (
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          isInvalid={isInvalid}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? `${id}-error` : undefined}
        />
      )}
      {isInvalid && errorMessage && (
        <ErrorText id={`${id}-error`} role="alert">
          {errorMessage}
        </ErrorText>
      )}
    </FieldContainer>
  );
};
