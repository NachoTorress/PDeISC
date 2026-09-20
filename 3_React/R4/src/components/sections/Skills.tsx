import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { skillCategories } from '../../data/portfolio';
import { theme } from '../../styles/theme';

const SkillsSection = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  color: ${theme.colors.textLight};
  padding: ${theme.spacing.xl} ${theme.spacing.md};
`;

const SectionTitle = styled(motion.h2)`
  text-align: center;
  font-size: clamp(2rem, 4vw, 2.5rem);
  margin-bottom: ${theme.spacing.xl};
  color: ${theme.colors.light};
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

const SkillsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: ${theme.spacing.lg};
  width: 100%;
  max-width: 1280px;
  margin-top: ${theme.spacing.xl};

  @media (min-width: ${theme.breakpoints.md}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const SkillCategory = styled(motion.article)`
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(8px);
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
  }
`;

const CategoryTitle = styled.h3`
  font-size: clamp(1.35rem, 3vw, 1.65rem);
  margin-bottom: ${theme.spacing.xl};
  color: ${theme.colors.light};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-weight: 600;
  position: relative;
  padding-bottom: ${theme.spacing.md};

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 40px;
    height: 3px;
    background-color: ${theme.colors.accent};
    border-radius: 2px;
  }

  svg {
    font-size: 1.8rem;
    color: ${theme.colors.accent};
  }
`;

const SkillsList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${theme.spacing.md};
  flex: 1;
  width: 100%;
`;

const SkillItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: clamp(0.88rem, 2vw, 1rem);
  padding: ${theme.spacing.md};
  border-radius: 12px;
  transition: all ${theme.transitions.default};
  background: ${theme.colors.glass.card};
  border: 1px solid ${theme.colors.glass.border};
  min-height: 62px;

  svg {
    font-size: 1.35rem;
    color: ${theme.colors.accent};
    flex-shrink: 0;
    transition: all ${theme.transitions.default};
  }

  &:hover {
    background: ${theme.colors.gradient.glass};
    transform: translateX(5px);

    svg {
      transform: scale(1.1) rotate(5deg);
      color: ${theme.colors.light};
    }
  }
`;

const Skills = () => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <SkillsSection id="skills" role="region" aria-label="Tecnologías e intereses">
      <SectionTitle
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Tecnologías e intereses
      </SectionTitle>
      <SkillsContainer role="list">
        {skillCategories.map((category) => {
          const CategoryIcon = category.icon;

          return (
            <SkillCategory
              key={category.title}
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              role="listitem"
              aria-labelledby={`category-title-${category.title}`}
            >
              <CategoryTitle id={`category-title-${category.title}`}>
                <CategoryIcon aria-hidden="true" />
                {category.title}
              </CategoryTitle>
              <SkillsList role="list" aria-label={`${category.title}`}>
                {category.skills.map((skill) => {
                  const SkillIcon = skill.icon;

                  return (
                    <SkillItem key={skill.name} variants={itemVariants} role="listitem">
                      <SkillIcon aria-hidden="true" />
                      <span>{skill.name}</span>
                    </SkillItem>
                  );
                })}
              </SkillsList>
            </SkillCategory>
          );
        })}
      </SkillsContainer>
    </SkillsSection>
  );
};

export default Skills;
