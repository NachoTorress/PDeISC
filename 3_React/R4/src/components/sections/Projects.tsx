import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaGithub } from 'react-icons/fa';
import { projects } from '../../data/portfolio';
import { theme } from '../../styles/theme';

const ProjectsSection = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  padding: ${theme.spacing.xl} 0;
`;

const SectionTitle = styled(motion.h2)`
  text-align: center;
  font-size: clamp(2rem, 4vw, 2.5rem);
  margin-bottom: calc(${theme.spacing.xl} * 1.2);
  color: ${theme.colors.textLight};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -${theme.spacing.md};
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 4px;
    background-color: ${theme.colors.accent};
    border-radius: 2px;
  }
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: ${theme.spacing.lg};
  width: 100%;

  @media (min-width: ${theme.breakpoints.lg}) {
    gap: ${theme.spacing.xl};
  }
`;

const ProjectCard = styled(motion.article)`
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(8px);
  border-radius: 16px;
  overflow: hidden;
  color: ${theme.colors.textLight};
  transition: all ${theme.transitions.default};
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid ${theme.colors.glass.border};
  box-shadow: var(--shadow-card);

  &:hover {
    transform: translateY(-5px);
  }
`;

const ProjectTop = styled.div`
  min-height: 160px;
  padding: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background:
    radial-gradient(circle at 20% 20%, ${theme.colors.accent}38, transparent 38%),
    ${theme.colors.gradient.glass};
`;

const ProjectAccent = styled.span`
  width: fit-content;
  color: ${theme.colors.textDark};
  background: ${theme.colors.gradient.accent};
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
`;

const ProjectContent = styled.div`
  padding: ${theme.spacing.lg};
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ProjectTitle = styled.h3`
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  margin-bottom: ${theme.spacing.sm};
  color: ${theme.colors.light};
  font-weight: 600;
`;

const ProjectDescription = styled.p`
  color: var(--color-muted);
  margin-bottom: ${theme.spacing.lg};
  font-size: 1rem;
  line-height: 1.65;
  flex: 1;
`;

const TechStack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.md};
`;

const TechTag = styled.span`
  background: ${theme.colors.glass.card};
  color: ${theme.colors.accent};
  border: 1px solid ${theme.colors.glass.border};
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
`;

const ProjectButton = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${theme.colors.textDark};
  background: ${theme.colors.gradient.accent};
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 700;
  transition: all ${theme.transitions.default};

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-card);
  }
`;

const ProjectLink = styled.a`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${theme.colors.textDark};
  background: ${theme.colors.gradient.accent};
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 700;
  transition: all ${theme.transitions.default};

  &:hover {
    color: ${theme.colors.textDark};
    transform: translateY(-2px);
    box-shadow: var(--shadow-card);
  }
`;

const ProjectNote = styled(motion.p)`
  color: var(--color-muted);
  margin-top: ${theme.spacing.md};
  margin-bottom: 0;
`;

const Projects = () => {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <ProjectsSection id="projects" role="region" aria-label="Proyectos">
      <div className="container">
        <SectionTitle
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Proyectos
        </SectionTitle>
        <ProjectGrid role="list">
          {projects.map((project) => {
            const isOpen = openProjectId === project.id;

            return (
              <ProjectCard
                key={project.id}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                role="listitem"
                aria-labelledby={`project-title-${project.id}`}
              >
                <ProjectTop>
                  <ProjectAccent>{project.accent}</ProjectAccent>
                </ProjectTop>
                <ProjectContent>
                  <ProjectTitle id={`project-title-${project.id}`}>{project.title}</ProjectTitle>
                  <ProjectDescription>{project.description}</ProjectDescription>
                  <TechStack role="list" aria-label={`Tecnologías o áreas de ${project.title}`}>
                    {project.tags.map((tech) => (
                      <TechTag key={tech} role="listitem">
                        {tech}
                      </TechTag>
                    ))}
                  </TechStack>
                  {'githubUrl' in project && project.githubUrl ? (
                    <ProjectLink href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      Ver en GitHub
                      <FaGithub aria-hidden="true" />
                    </ProjectLink>
                  ) : (
                    <ProjectButton
                      type="button"
                      onClick={() => setOpenProjectId(isOpen ? null : project.id)}
                      aria-expanded={isOpen}
                      aria-controls={`project-note-${project.id}`}
                    >
                      {isOpen ? 'Ocultar detalle' : 'Ver detalle'}
                      {isOpen ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
                    </ProjectButton>
                  )}
                  {isOpen && (
                    <ProjectNote
                      id={`project-note-${project.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      La consigna no incluye un enlace público específico para este proyecto, por eso no se agrega un
                      link inventado.
                    </ProjectNote>
                  )}
                </ProjectContent>
              </ProjectCard>
            );
          })}
        </ProjectGrid>
      </div>
    </ProjectsSection>
  );
};

export default Projects;
