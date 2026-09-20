/**
 * About Section Component.
 * Displays education history, competencies, and achievements.
 * Supports Admin CRUD and inline delete confirmation cards.
 */
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaMedal, FaSchool, FaPlus, FaTrash } from 'react-icons/fa';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDeleteCard } from '../common/ConfirmDeleteCard';
import { AdminCrudModal } from '../admin/AdminCrudModal';
import { theme } from '../../styles/theme';

const AboutSection = styled.section`
  min-height: 72vh;
  display: flex;
  align-items: center;
  color: ${theme.colors.textLight};
  padding: ${theme.spacing.xl} 0;
`;

const SectionTitle = styled(motion.h2)`
  font-size: clamp(2rem, 4vw, 2.5rem);
  margin-bottom: ${theme.spacing.lg};
  color: ${theme.colors.light};
`;

const InfoCard = styled(motion.article)`
  position: relative;
  height: 100%;
  padding: ${theme.spacing.lg};
  border-radius: 16px;
  background: ${theme.colors.glass.background};
  border: 1px solid ${theme.colors.glass.border};
  box-shadow: var(--shadow-card);

  svg {
    color: ${theme.colors.accent};
    font-size: 2rem;
    margin-bottom: ${theme.spacing.md};
  }
`;

const InfoList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--color-muted);

  li {
    position: relative;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    border-radius: 8px;
    background: ${theme.colors.glass.card};
    border: 1px solid ${theme.colors.glass.border};
    margin-bottom: ${theme.spacing.sm};
  }
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const AddButton = styled.button`
  background: ${theme.colors.gradient.accent};
  color: ${theme.colors.textDark};
  border: none;
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
  cursor: pointer;
`;

const DeleteBtn = styled.button`
  background: transparent;
  color: #ff6b6b;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.2rem;
  margin-left: 0.5rem;

  &:hover {
    color: #e63946;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.md};
`;

const About = () => {
  const { education, achievements, deleteExperience, deleteAchievement } = useData();
  const { isAdmin } = useAuth();

  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [deleteType, setDeleteType] = useState<'exp' | 'ach' | null>(null);
  const [crudModalOpen, setCrudModalOpen] = useState(false);
  const [crudType, setCrudType] = useState<'experience' | 'achievement'>('experience');

  const openAddModal = (type: 'experience' | 'achievement') => {
    setCrudType(type);
    setCrudModalOpen(true);
  };

  return (
    <AboutSection id="about" role="region" aria-label="Sobre mí">
      <div className="container-fluid">
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaSchool aria-hidden="true" />
                  <h3 style={{ margin: 0 }}>Formación</h3>
                </div>
                {isAdmin && (
                  <AddButton onClick={() => openAddModal('experience')}>
                    <FaPlus /> Agregar
                  </AddButton>
                )}
              </CardHeader>
              <InfoList>
                {education.map((item) => (
                  <li key={item.id}>
                    {deletingId === item.id && deleteType === 'exp' && (
                      <ConfirmDeleteCard
                        title={item.title}
                        onConfirm={() => {
                          deleteExperience(item.id);
                          setDeletingId(null);
                        }}
                        onCancel={() => setDeletingId(null)}
                      />
                    )}
                    <ItemHeader>
                      <div>
                        <strong>{item.title}:</strong> {item.description} {item.meta}
                      </div>
                      {isAdmin && (
                        <DeleteBtn
                          onClick={() => {
                            setDeletingId(item.id);
                            setDeleteType('exp');
                          }}
                          aria-label={`Eliminar ${item.title}`}
                        >
                          <FaTrash />
                        </DeleteBtn>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FaMedal aria-hidden="true" />
                  <h3 style={{ margin: 0 }}>Competencias y participación</h3>
                </div>
                {isAdmin && (
                  <AddButton onClick={() => openAddModal('achievement')}>
                    <FaPlus /> Agregar
                  </AddButton>
                )}
              </CardHeader>
              <InfoList>
                {achievements.map((item) => (
                  <li key={item.id}>
                    {deletingId === item.id && deleteType === 'ach' && (
                      <ConfirmDeleteCard
                        title={item.title}
                        onConfirm={() => {
                          deleteAchievement(item.id);
                          setDeletingId(null);
                        }}
                        onCancel={() => setDeletingId(null)}
                      />
                    )}
                    <ItemHeader>
                      <div>
                        <strong>{item.title}:</strong> {item.description}
                      </div>
                      {isAdmin && (
                        <DeleteBtn
                          onClick={() => {
                            setDeletingId(item.id);
                            setDeleteType('ach');
                          }}
                          aria-label={`Eliminar ${item.title}`}
                        >
                          <FaTrash />
                        </DeleteBtn>
                      )}
                    </ItemHeader>
                  </li>
                ))}
              </InfoList>
            </InfoCard>
          </div>
        </div>
      </div>

      <AdminCrudModal type={crudType} isOpen={crudModalOpen} onClose={() => setCrudModalOpen(false)} />
    </AboutSection>
  );
};

export default About;
