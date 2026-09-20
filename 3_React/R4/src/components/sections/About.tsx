/**
 * About Section Component.
 * Displays education history, competencies, and achievements with sleek card layout.
 * Supports Admin CRUD (Add, Edit with pre-filled fields, Delete with inline confirmation).
 */
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaGraduationCap, FaTrophy, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDeleteCard } from '../common/ConfirmDeleteCard';
import { AdminCrudModal } from '../admin/AdminCrudModal';
import { theme } from '../../styles/theme';

const AboutSection = styled.section`
  min-height: auto;
  display: flex;
  align-items: center;
  color: ${theme.colors.textLight};
  padding: ${theme.spacing.lg} 0;
`;

const SectionTitle = styled(motion.h2)`
  font-size: clamp(2rem, 4vw, 2.5rem);
  margin-bottom: ${theme.spacing.lg};
  color: ${theme.colors.light};
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: ${theme.colors.accent};
  }
`;

const InfoCard = styled(motion.article)`
  position: relative;
  height: 100%;
  padding: ${theme.spacing.lg};
  border-radius: 20px;
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(12px);
  border: 1px solid ${theme.colors.glass.border};
  box-shadow: var(--shadow-card);
  transition: transform ${theme.transitions.default};

  &:hover {
    transform: translateY(-4px);
    border-color: ${theme.colors.accent}55;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md};
  padding-bottom: ${theme.spacing.sm};
  border-bottom: 1px solid ${theme.colors.glass.border};

  h3 {
    margin: 0;
    font-size: clamp(1.2rem, 2.2vw, 1.45rem);
    color: ${theme.colors.light};
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    svg {
      color: ${theme.colors.accent};
      font-size: 1.4rem;
      margin: 0;
    }
  }
`;

const AddButton = styled.button`
  background: ${theme.colors.gradient.accent};
  color: ${theme.colors.textDark};
  border: none;
  border-radius: 999px;
  padding: 0.45rem 0.95rem;
  font-size: 0.82rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(246, 177, 122, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(246, 177, 122, 0.35);
  }
`;

const InfoList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--color-muted);

  li {
    position: relative;
    padding: ${theme.spacing.md};
    min-height: 56px;
    border-radius: 12px;
    background: ${theme.colors.glass.card};
    border: 1px solid ${theme.colors.glass.border};
    margin-bottom: ${theme.spacing.sm};
    transition: all ${theme.transitions.default};
    overflow: hidden;

    &:hover {
      background: ${theme.colors.gradient.glass};
    }
  }
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${theme.spacing.sm};
`;

const ItemText = styled.div`
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.5;

  strong {
    color: ${theme.colors.light};
  }
`;

const ActionIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
`;

const IconBtn = styled.button<{ danger?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.danger ? 'rgba(230, 57, 70, 0.18)' : 'rgba(246, 177, 122, 0.18)')};
  color: ${(props) => (props.danger ? '#ff6b6b' : theme.colors.accent)};
  border: 1px solid ${(props) => (props.danger ? 'rgba(230, 57, 70, 0.35)' : 'rgba(246, 177, 122, 0.35)')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
    background: ${(props) => (props.danger ? '#e63946' : theme.colors.accent)};
    color: ${(props) => (props.danger ? '#ffffff' : theme.colors.textDark)};
  }
`;

const About = () => {
  const { education, achievements, deleteExperience, deleteAchievement } = useData();
  const { isAdmin } = useAuth();

  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [deleteType, setDeleteType] = useState<'exp' | 'ach' | null>(null);
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [crudType, setCrudType] = useState<'experience' | 'achievement'>('experience');
  const [editingItem, setEditingItem] = useState<any>(null);

  const openAddModal = (type: 'experience' | 'achievement') => {
    setEditingItem(null);
    setCrudType(type);
    setCrudModalOpen(true);
  };

  const openEditModal = (type: 'experience' | 'achievement', item: any) => {
    setEditingItem(item);
    setCrudType(type);
    setCrudModalOpen(true);
  };

  return (
    <AboutSection id="about" role="region" aria-label="Sobre mí">
      <div className="container-fluid px-3 px-md-4">
        <SectionTitle
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Sobre mí
        </SectionTitle>
        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <InfoCard initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <CardHeader>
                <h3>
                  <FaGraduationCap /> Formación
                </h3>
                {isAdmin && (
                  <AddButton onClick={() => openAddModal('experience')}>
                    <FaPlus /> Agregar Formación
                  </AddButton>
                )}
              </CardHeader>
              <InfoList>
                {education.map((item) => (
                  <li key={item.id}>
                    {deletingId === item.id && deleteType === 'exp' && (
                      <ConfirmDeleteCard
                        compact
                        title={item.title}
                        onConfirm={() => {
                          deleteExperience(item.id);
                          setDeletingId(null);
                        }}
                        onCancel={() => setDeletingId(null)}
                      />
                    )}
                    <ItemHeader>
                      <ItemText>
                        <strong>{item.title}:</strong> {item.description} {item.meta}
                      </ItemText>
                      {isAdmin && (
                        <ActionIcons>
                          <IconBtn onClick={() => openEditModal('experience', item)} title="Editar información">
                            <FaEdit />
                          </IconBtn>
                          <IconBtn
                            danger
                            onClick={() => {
                              setDeletingId(item.id);
                              setDeleteType('exp');
                            }}
                            title="Eliminar información"
                          >
                            <FaTrash />
                          </IconBtn>
                        </ActionIcons>
                      )}
                    </ItemHeader>
                  </li>
                ))}
              </InfoList>
            </InfoCard>
          </div>

          <div className="col-12 col-lg-7">
            <InfoCard
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <CardHeader>
                <h3>
                  <FaTrophy /> Competencias y Participación
                </h3>
                {isAdmin && (
                  <AddButton onClick={() => openAddModal('achievement')}>
                    <FaPlus /> Agregar Logro
                  </AddButton>
                )}
              </CardHeader>
              <InfoList>
                {achievements.map((item) => (
                  <li key={item.id}>
                    {deletingId === item.id && deleteType === 'ach' && (
                      <ConfirmDeleteCard
                        compact
                        title={item.title}
                        onConfirm={() => {
                          deleteAchievement(item.id);
                          setDeletingId(null);
                        }}
                        onCancel={() => setDeletingId(null)}
                      />
                    )}
                    <ItemHeader>
                      <ItemText>
                        <strong>{item.title}:</strong> {item.description}
                      </ItemText>
                      {isAdmin && (
                        <ActionIcons>
                          <IconBtn onClick={() => openEditModal('achievement', item)} title="Editar logro">
                            <FaEdit />
                          </IconBtn>
                          <IconBtn
                            danger
                            onClick={() => {
                              setDeletingId(item.id);
                              setDeleteType('ach');
                            }}
                            title="Eliminar logro"
                          >
                            <FaTrash />
                          </IconBtn>
                        </ActionIcons>
                      )}
                    </ItemHeader>
                  </li>
                ))}
              </InfoList>
            </InfoCard>
          </div>
        </div>
      </div>

      <AdminCrudModal
        type={crudType}
        isOpen={crudModalOpen}
        onClose={() => setCrudModalOpen(false)}
        editItem={editingItem}
      />
    </AboutSection>
  );
};

export default About;
