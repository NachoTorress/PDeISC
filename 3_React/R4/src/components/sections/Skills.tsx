/**
 * Skills Section Component.
 * Renders categorized skill grid with icons and Admin CRUD.
 */
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useState } from 'react';
import type { IconType } from 'react-icons';
import { FaBrain, FaCode, FaDatabase, FaDocker, FaGitAlt, FaLinux, FaMicrochip, FaNodeJs, FaPlus, FaReact, FaServer, FaTrash, FaEdit } from 'react-icons/fa';
import { SiCplusplus, SiPython, SiTypescript } from 'react-icons/si';
import { useData } from '../../contexts/DataContext';
import type { SkillItemData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDeleteCard } from '../common/ConfirmDeleteCard';
import { AdminCrudModal } from '../admin/AdminCrudModal';
import { theme } from '../../styles/theme';

const SkillsSection = styled.section`
  min-height: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  color: ${theme.colors.textLight};
  padding: ${theme.spacing.lg} 0;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
`;

const SectionTitle = styled(motion.h2)`
  font-size: 2rem;
  color: ${theme.colors.light};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (min-width: ${theme.breakpoints.md}) {
    font-size: 2.5rem;
  }

  svg {
    color: ${theme.colors.accent};
  }
`;

const SkillsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${theme.spacing.lg};
  width: 100%;

  @media (min-width: ${theme.breakpoints.md}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const EmptyCategories = styled.p`
  grid-column: 1 / -1;
  margin: 0;
  padding: ${theme.spacing.lg};
  color: var(--color-muted);
  text-align: center;
`;

const SkillCategory = styled(motion.article)`
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: ${theme.spacing.lg};
  transition: all ${theme.transitions.default};
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid ${theme.colors.glass.border};
  box-shadow: var(--shadow-card);

  &:hover {
    transform: translateY(-5px);
    border-color: ${theme.colors.accent}55;
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md};
  padding-bottom: ${theme.spacing.sm};
  border-bottom: 1px solid ${theme.colors.glass.border};
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
`;

const CategoryTitle = styled.h3`
  font-size: 1.2rem;
  color: ${theme.colors.light};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  margin: 0;

  @media (min-width: ${theme.breakpoints.md}) {
    font-size: 1.4rem;
  }

  svg {
    font-size: 1.4rem;
    color: ${theme.colors.accent};
  }
`;

const AddSkillBtn = styled.button`
  background: ${theme.colors.gradient.accent};
  color: ${theme.colors.textDark};
  border: none;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.95rem;
  min-height: 44px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
`;

const SkillsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.35rem 0.5rem;
  width: 100%;
`;

const EmptySkills = styled.p`
  width: 100%;
  margin: 0;
  padding: ${theme.spacing.sm} 0;
  color: var(--color-muted);
  font-style: italic;
`;

const SkillItem = styled(motion.div)`
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.55rem 0.6rem;
  min-height: 44px;
  max-width: 100%;
  border-radius: 8px;
  transition: all ${theme.transitions.default};
  background: transparent;
  border: 1px solid transparent;

  &:hover {
    background: ${theme.colors.glass.card};
    border-color: ${theme.colors.glass.border};
  }
`;

const SkillLabelGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;

  svg {
    font-size: 1.25rem;
    color: ${theme.colors.accent};
    flex-shrink: 0;
  }

  span {
    word-break: normal;
    overflow-wrap: break-word;
    hyphens: manual;
    line-height: 1.25;
  }
`;

const AdminSkillActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
`;

const IconBtn = styled.button<{ danger?: boolean }>`
  background: transparent;
  color: ${(props) => (props.danger ? '#ff6b6b' : theme.colors.accent)};
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${(props) => (props.danger ? '#e63946' : theme.colors.light)};
  }
`;

const iconMap: Record<string, IconType> = {
  code: FaCode,
  brain: FaBrain,
  cplusplus: SiCplusplus,
  typescript: SiTypescript,
  python: SiPython,
  sql: FaDatabase,
  node: FaNodeJs,
  docker: FaDocker,
  git: FaGitAlt,
  linux: FaLinux,
  microchip: FaMicrochip,
  react: FaReact,
};

const Skills = () => {
  const { skillCategories, deleteSkill } = useData();
  const { isAdmin } = useAuth();

  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [targetCategory, setTargetCategory] = useState<string | number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillItemData | null>(null);

  const openAddModal = (catId: string | number) => {
    setEditingSkill(null);
    setTargetCategory(catId);
    setIsModalOpen(true);
  };

  const openEditModal = (skill: SkillItemData) => {
    setEditingSkill(skill);
    setIsModalOpen(true);
  };

  return (
    <SkillsSection id="skills" role="region" aria-label="Tecnologías e intereses">
      <div className="container-fluid px-3 px-md-4">
        <HeaderRow>
          <SectionTitle
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <FaServer /> Tecnologías e Intereses
          </SectionTitle>
        </HeaderRow>
        <SkillsContainer role={skillCategories.length > 0 ? 'list' : 'status'} aria-label="Categorías de habilidades">
          {skillCategories.length === 0 ? (
            <EmptyCategories>Todavía no hay categorías de habilidades cargadas.</EmptyCategories>
          ) : skillCategories.map((category) => {
            const CategoryIcon = iconMap[category.icon] || FaCode;

            return (
              <SkillCategory
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                role="listitem"
              >
                <CategoryHeader>
                  <CategoryTitle>
                    <CategoryIcon aria-hidden="true" />
                    {category.title}
                  </CategoryTitle>
                  {isAdmin && (
                    <AddSkillBtn onClick={() => openAddModal(category.id)}>
                      <FaPlus /> Habilidad
                    </AddSkillBtn>
                  )}
                </CategoryHeader>
                <SkillsList role={category.skills.length > 0 ? 'list' : 'status'} aria-label={`Habilidades de ${category.title}`}>
                  {category.skills.length === 0 ? (
                    <EmptySkills>Todavía no hay habilidades en esta categoría.</EmptySkills>
                  ) : category.skills.map((skill) => {
                    const SkillIcon = iconMap[skill.icon] || FaCode;

                    return (
                      <SkillItem key={skill.id} role="listitem">
                        {deletingId === skill.id && (
                          <ConfirmDeleteCard
                            compact
                            title={skill.name}
                            onConfirm={() => {
                              deleteSkill(skill.id);
                              setDeletingId(null);
                            }}
                            onCancel={() => setDeletingId(null)}
                          />
                        )}
                        <SkillLabelGroup>
                          <SkillIcon aria-hidden="true" />
                          <span>{skill.name}</span>
                        </SkillLabelGroup>
                        {isAdmin && (
                          <AdminSkillActions>
                            <IconBtn onClick={() => openEditModal(skill)} title="Editar habilidad">
                              <FaEdit />
                            </IconBtn>
                            <IconBtn danger onClick={() => setDeletingId(skill.id)} title="Eliminar habilidad">
                              <FaTrash />
                            </IconBtn>
                          </AdminSkillActions>
                        )}
                      </SkillItem>
                    );
                  })}
                </SkillsList>
              </SkillCategory>
            );
          })}
        </SkillsContainer>
      </div>

      <AdminCrudModal
        type="skill"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryId={targetCategory ?? undefined}
        editItem={editingSkill}
      />
    </SkillsSection>
  );
};

export default Skills;
