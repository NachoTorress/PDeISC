/**
 * Projects Section Component.
 * Displays project cards with tech tags, single-use detail toggle hiding,
 * and Admin CRUD (Add, Edit, Delete with styled inline confirmation cards).
 */
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaChevronDown, FaGithub, FaPlus, FaTrash, FaEdit, FaFolder } from 'react-icons/fa';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmDeleteCard } from '../common/ConfirmDeleteCard';
import { AdminCrudModal } from '../admin/AdminCrudModal';
import { theme } from '../../styles/theme';

const ProjectsSection = styled.section`
  min-height: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  padding: ${theme.spacing.lg} 0;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: calc(${theme.spacing.xl} * 0.8);
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
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

const AddProjectBtn = styled.button`
  background: ${theme.colors.gradient.accent};
  color: ${theme.colors.textDark};
  border: none;
  border-radius: 999px;
  padding: 0.55rem 1.1rem;
  font-weight: 700;
  font-size: 0.88rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: ${theme.spacing.lg};
  width: 100%;
`;

const ProjectCard = styled(motion.article)`
  position: relative;
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(12px);
  border-radius: 20px;
  overflow: hidden;
  color: ${theme.colors.textLight};
  transition: all ${theme.transitions.default};
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid ${theme.colors.glass.border};
  box-shadow: var(--shadow-card);

  &:hover {
    transform: translateY(-6px);
    border-color: ${theme.colors.accent}66;
  }
`;

const ProjectTop = styled.div`
  min-height: 100px;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background:
    radial-gradient(circle at 20% 20%, ${theme.colors.accent}28, transparent 50%),
    ${theme.colors.gradient.glass};
  border-bottom: 1px solid ${theme.colors.glass.border};
`;

const ProjectAccent = styled.span`
  color: ${theme.colors.textDark};
  background: ${theme.colors.gradient.accent};
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
`;

const AdminIconGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const IconBtn = styled.button<{ danger?: boolean }>`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.danger ? 'rgba(230, 57, 70, 0.2)' : theme.colors.glass.card)};
  color: ${(props) => (props.danger ? '#ff6b6b' : theme.colors.light)};
  border: 1px solid ${(props) => (props.danger ? 'rgba(230, 57, 70, 0.4)' : theme.colors.glass.border)};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
    background: ${(props) => (props.danger ? '#e63946' : theme.colors.accent)};
    color: ${(props) => (props.danger ? '#ffffff' : theme.colors.textDark)};
  }
`;

const ProjectContent = styled.div`
  padding: ${theme.spacing.lg};
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ProjectTitle = styled.h3`
  font-size: clamp(1.25rem, 2.5vw, 1.45rem);
  margin-bottom: ${theme.spacing.xs};
  color: ${theme.colors.light};
  font-weight: 700;
`;

const ProjectDescription = styled.p`
  color: var(--color-muted);
  margin-bottom: ${theme.spacing.md};
  font-size: 0.95rem;
  line-height: 1.6;
  flex: 1;
`;

const TechStack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: ${theme.spacing.md};
`;

const TechTag = styled.span`
  background: ${theme.colors.glass.card};
  color: ${theme.colors.accent};
  border: 1px solid ${theme.colors.glass.border};
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: auto;
`;

const ProjectButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${theme.colors.textDark};
  background: ${theme.colors.gradient.accent};
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-weight: 700;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
  transition: all ${theme.transitions.default};

  &:hover {
    transform: translateY(-2px);
  }
`;

const ProjectLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${theme.colors.textDark};
  background: ${theme.colors.gradient.accent};
  border-radius: 999px;
  padding: 0.5rem 1rem;
  font-weight: 700;
  font-size: 0.85rem;
  transition: all ${theme.transitions.default};

  &:hover {
    color: ${theme.colors.textDark};
    transform: translateY(-2px);
  }
`;

const ProjectNote = styled(motion.p)`
  color: var(--color-muted);
  margin-top: ${theme.spacing.md};
  margin-bottom: 0;
  font-size: 0.85rem;
  background: ${theme.colors.glass.card};
  padding: 0.6rem;
  border-radius: 8px;
  border: 1px solid ${theme.colors.glass.border};
`;

const Projects = () => {
  const { projects, deleteProject } = useData();
  const { isAdmin } = useAuth();

  const [openProjectId, setOpenProjectId] = useState<string | number | null>(null);
  const [usedButtons, setUsedButtons] = useState<Record<string | number, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const handleSingleUseClick = (projectId: string | number) => {
    setOpenProjectId((current) => (current === projectId ? null : projectId));
    setUsedButtons((prev) => ({ ...prev, [projectId]: true }));
  };

  const openAddModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project: any) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  return (
    <ProjectsSection id="projects" role="region" aria-label="Proyectos">
      <div className="container-fluid px-3 px-md-4">
        <HeaderRow>
          <SectionTitle
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <FaFolder /> Proyectos
          </SectionTitle>
          {isAdmin && (
            <AddProjectBtn onClick={openAddModal}>
              <FaPlus /> Agregar Proyecto
            </AddProjectBtn>
          )}
        </HeaderRow>
        <ProjectGrid role="list">
          {projects.map((project) => {
            const isOpen = openProjectId === project.id;
            const isSingleUseConsumed = usedButtons[project.id];

            return (
              <ProjectCard
                key={project.id}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                role="listitem"
              >
                {deletingId === project.id && (
                  <ConfirmDeleteCard
                    title={project.title}
                    onConfirm={() => {
                      deleteProject(project.id);
                      setDeletingId(null);
                    }}
                    onCancel={() => setDeletingId(null)}
                  />
                )}
                <ProjectTop>
                  <ProjectAccent>{project.accent}</ProjectAccent>
                  {isAdmin && (
                    <AdminIconGroup>
                      <IconBtn onClick={() => openEditModal(project)} title="Editar proyecto">
                        <FaEdit />
                      </IconBtn>
                      <IconBtn danger onClick={() => setDeletingId(project.id)} title="Eliminar proyecto">
                        <FaTrash />
                      </IconBtn>
                    </AdminIconGroup>
                  )}
                </ProjectTop>
                <ProjectContent>
                  <ProjectTitle>{project.title}</ProjectTitle>
                  <ProjectDescription>{project.description}</ProjectDescription>
                  <TechStack role="list" aria-label={`Tecnologías de ${project.title}`}>
                    {project.tags.map((tech) => (
                      <TechTag key={tech} role="listitem">
                        {tech}
                      </TechTag>
                    ))}
                  </TechStack>
                  <ActionRow>
                    {project.githubUrl ? (
                      <ProjectLink href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        Ver en GitHub <FaGithub aria-hidden="true" />
                      </ProjectLink>
                    ) : (
                      !isSingleUseConsumed && (
                        <ProjectButton
                          type="button"
                          onClick={() => handleSingleUseClick(project.id)}
                          aria-expanded={isOpen}
                        >
                          Ver detalle <FaChevronDown aria-hidden="true" />
                        </ProjectButton>
                      )
                    )}
                  </ActionRow>

                  {isOpen && (
                    <ProjectNote
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      Detalles técnicos: Desarrollado con arquitectura C++ / React, controladores modularizados y lógica optimizada.
                    </ProjectNote>
                  )}
                </ProjectContent>
              </ProjectCard>
            );
          })}
        </ProjectGrid>
      </div>

      <AdminCrudModal
        type="project"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editItem={editingProject}
      />
    </ProjectsSection>
  );
};

export default Projects;
