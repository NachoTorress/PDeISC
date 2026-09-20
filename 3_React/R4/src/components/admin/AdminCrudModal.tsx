/**
 * Admin CRUD Modal Component.
 * Dynamic form for creating and editing skills, projects, and achievements with real-time field validation.
 */
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTimes } from 'react-icons/fa';
import { useData } from '../../contexts/DataContext';
import { FormField } from '../common/FormField';
import { validateName, validateBirthDateAndCalculateAge } from '../../utils/validation';
import { theme } from '../../styles/theme';

interface AdminCrudModalProps {
  type: 'skill' | 'project' | 'experience' | 'achievement';
  isOpen: boolean;
  onClose: () => void;
  categoryId?: string | number;
  editItem?: any;
}

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
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
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
    font-size: 1.5rem;
  }

  h3 {
    margin: 0;
    font-size: 1.35rem;
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

const AgeDisplay = styled.div`
  background: rgba(246, 177, 122, 0.15);
  border: 1px solid ${theme.colors.accent};
  color: ${theme.colors.accent};
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: ${theme.spacing.md};
`;

export const AdminCrudModal: React.FC<AdminCrudModalProps> = ({
  type,
  isOpen,
  onClose,
  categoryId,
  editItem,
}) => {
  const {
    addSkill,
    updateSkill,
    addProject,
    updateProject,
    addExperience,
    updateExperience,
    addAchievement,
    updateAchievement,
  } = useData();

  const [skillName, setSkillName] = useState('');
  const [skillError, setSkillError] = useState('');

  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [description, setDescription] = useState('');
  const [accent, setAccent] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [tags, setTags] = useState('');

  const [birthDate, setBirthDate] = useState('');
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [ageError, setAgeError] = useState('');
  const [meta, setMeta] = useState('');

  useEffect(() => {
    if (editItem) {
      if (type === 'skill') {
        setSkillName(editItem.name || '');
      } else if (type === 'project') {
        setTitle(editItem.title || '');
        setDescription(editItem.description || '');
        setAccent(editItem.accent || '');
        setGithubUrl(editItem.githubUrl || '');
        setTags(Array.isArray(editItem.tags) ? editItem.tags.join(', ') : editItem.tags || '');
      } else {
        setTitle(editItem.title || '');
        setDescription(editItem.description || '');
        setMeta(editItem.meta || '');
      }
    } else {
      setSkillName('');
      setTitle('');
      setDescription('');
      setAccent('');
      setGithubUrl('');
      setTags('');
      setBirthDate('');
      setCalculatedAge(null);
      setMeta('');
    }
  }, [editItem, type, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string, setter: (s: string) => void, errorSetter: (s: string) => void) => {
    setter(val);
    const result = validateName(val);
    errorSetter(result.isValid ? '' : result.errorMessage);
  };

  const handleBirthDateChange = (dateVal: string) => {
    setBirthDate(dateVal);
    if (!dateVal) {
      setCalculatedAge(null);
      setAgeError('');
      return;
    }
    const { age, result } = validateBirthDateAndCalculateAge(dateVal);
    setCalculatedAge(age);
    setAgeError(result.isValid ? '' : result.errorMessage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'skill') {
      const v = validateName(skillName);
      if (!v.isValid) {
        setSkillError(v.errorMessage);
        return;
      }
      if (editItem) {
        await updateSkill(editItem.id, skillName);
      } else if (categoryId) {
        await addSkill(categoryId, skillName);
      }
    } else if (type === 'project') {
      if (!title || !description || !accent) return;
      const projectPayload = {
        title,
        description,
        accent,
        githubUrl: githubUrl || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()) : ['General'],
      };
      if (editItem) {
        await updateProject(editItem.id, projectPayload);
      } else {
        await addProject(projectPayload);
      }
    } else if (type === 'experience') {
      if (!title || !description) return;
      if (birthDate) {
        const { result } = validateBirthDateAndCalculateAge(birthDate);
        if (!result.isValid) {
          setAgeError(result.errorMessage);
          return;
        }
      }
      const expPayload = {
        type: 'education' as const,
        title,
        description,
        meta: calculatedAge ? `(Edad calculada: ${calculatedAge} años) ${meta}` : meta,
      };
      if (editItem) {
        await updateExperience(editItem.id, expPayload);
      } else {
        await addExperience(expPayload);
      }
    } else if (type === 'achievement') {
      if (!title || !description) return;
      const achPayload = { title, description };
      if (editItem) {
        await updateAchievement(editItem.id, achPayload);
      } else {
        await addAchievement(achPayload);
      }
    }

    onClose();
  };

  return (
    <Backdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <ModalCard initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <CloseButton onClick={onClose} aria-label="Cerrar modal">
          <FaTimes />
        </CloseButton>
        <Header>
          {editItem ? <FaEdit /> : <FaPlus />}
          <h3>
            {editItem ? 'Editar' : 'Agregar'}{' '}
            {type === 'skill' && 'Habilidad'}
            {type === 'project' && 'Proyecto'}
            {type === 'experience' && 'Formación / Experiencia'}
            {type === 'achievement' && 'Logro'}
          </h3>
        </Header>
        <form onSubmit={handleSubmit}>
          {type === 'skill' && (
            <FormField
              id="skill-name"
              label="Nombre de la Habilidad / Tecnología"
              value={skillName}
              onChange={(e) => handleNameChange(e.target.value, setSkillName, setSkillError)}
              errorMessage={skillError}
              isValid={!skillError}
              required
            />
          )}

          {type === 'project' && (
            <>
              <FormField
                id="project-title"
                label="Título del Proyecto"
                value={title}
                onChange={(e) => handleNameChange(e.target.value, setTitle, setTitleError)}
                errorMessage={titleError}
                isValid={!titleError}
                required
              />
              <FormField
                id="project-accent"
                label="Etiqueta Principal / Categoría"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                required
              />
              <FormField
                id="project-desc"
                label="Descripción del Proyecto"
                type="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <FormField
                id="project-github"
                label="URL de GitHub (opcional)"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              <FormField
                id="project-tags"
                label="Tecnologías (separadas por comas)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </>
          )}

          {(type === 'experience' || type === 'achievement') && (
            <>
              <FormField
                id="item-title"
                label="Título"
                value={title}
                onChange={(e) => handleNameChange(e.target.value, setTitle, setTitleError)}
                errorMessage={titleError}
                isValid={!titleError}
                required
              />
              <FormField
                id="item-desc"
                label="Descripción"
                type="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              {type === 'experience' && (
                <>
                  <FormField
                    id="item-birthdate"
                    label="Fecha de Nacimiento del Participante (para Cálculo de Edad)"
                    type="date"
                    value={birthDate}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    errorMessage={ageError}
                    isValid={!ageError}
                  />
                  {calculatedAge !== null && !ageError && (
                    <AgeDisplay>Edad calculada automáticamente: {calculatedAge} años</AgeDisplay>
                  )}
                  <FormField
                    id="item-meta"
                    label="Detalles adicionales / Período (ej: 2024 - Presente)"
                    value={meta}
                    onChange={(e) => setMeta(e.target.value)}
                  />
                </>
              )}
            </>
          )}

          <SubmitBtn type="submit">{editItem ? 'Guardar Cambios' : 'Guardar'}</SubmitBtn>
        </form>
      </ModalCard>
    </Backdrop>
  );
};
