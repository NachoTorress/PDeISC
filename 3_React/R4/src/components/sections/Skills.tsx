/**
 * Skills Section Component.
 * Renders categorized skill grid with icons and Admin CRUD.
 */
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaBrain, FaCode, FaDocker, FaGitAlt, FaLinux, FaMicrochip, FaNodeJs, FaPlus, FaReact, FaServer, FaTrash, FaEdit } from 'react-icons/fa';
import { SiCplusplus, SiPython, SiSqlite, SiTypescript } from 'react-icons/si';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDeleteCard } from '../common/ConfirmDeleteCard';
import { AdminCrudModal } from '../admin/AdminCrudModal';
import { theme } from '../../styles/theme';

const SkillsSection = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  color: ${theme.colors.textLight};
  padding: ${theme.spacing.xl} 0;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
`;

const SectionTitle = styled(motion.h2)`
  font-size: clamp(2rem, 4vw, 2.5rem);
  color: ${theme.colors.light};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

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

const SkillCategory = styled(motion.article)`
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(12px);
  border-radius: 20px;
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
`;

const CategoryTitle = styled.h3`
  font-size: clamp(1.2rem, 2.2vw, 1.45rem);
  color: ${theme.colors.light};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  margin: 0;

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
  font-size: 0.78rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
`;

const SkillsList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  flex: 1;
  width: 100%;
`;

const SkillItem = styled(motion.div)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.92rem;
  font-weight: 600;
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  transition: all ${theme.transitions.default};
  background: ${theme.colors.glass.card};
  border: 1px solid ${theme.colors.glass.border};

  &:hover {
    background: ${theme.colors.gradient.glass};
    transform: translateX(3px);
  }
`;

const SkillLabelGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    font-size: 1.25rem;
    color: ${theme.colors.accent};
    flex-shrink: 0;
  }
`;

const AdminSkillActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
`;

const IconBtn = styled.button<{ danger?: boolean }>`
  background: transparent;
  color: ${(props) => (props.danger ? '#ff6b6b' : theme.colors.accent)};
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.15rem;

  &:hover {
    color: ${(props) => (props.danger ? '#e63946' : theme.colors.light)};
  }
`;

const iconMap: Record<string, any> = {
  code: FaCode,
  brain: FaBrain,
  cplusplus: SiCplusplus,
  typescript: SiTypescript,
  python: SiPython,
  sql: SiSqlite,
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
  const [editingSkill, setEditingSkill] = useState<any>(null);

  const openAddModal = (catId: string | number) => {
    setEditingSkill(null);
    setTargetCategory(catId);
    setIsModalOpen(true);
  };

  const openEditModal = (skill: any) => {
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
        <SkillsContainer role="list">
          {skillCategories.map((category) => {
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
                <SkillsList role="list">
                  {category.skills.map((skill) => {
                    const SkillIcon = iconMap[skill.icon] || FaCode;

                    return (
                      <SkillItem key={skill.id} role="listitem">
                        {deletingId === skill.id && (
                          <ConfirmDeleteCard
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
