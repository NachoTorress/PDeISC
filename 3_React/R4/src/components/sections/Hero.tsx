/**
 * Hero Section Component.
 * Feature intro banner with icon tech badges and direct smooth-scroll actions.
 */
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { FaArrowDown, FaCode, FaDocker, FaGitAlt, FaLinux, FaNodeJs, FaReact, FaServer } from 'react-icons/fa';
import { SiCplusplus, SiPython, SiSqlite, SiTypescript } from 'react-icons/si';
import { profile } from '../../data/portfolio';
import { theme } from '../../styles/theme';

const HeroSection = styled.section`
  min-height: auto;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  color: ${theme.colors.textLight};
  padding: calc(${theme.spacing.xl} * 0.5) 0;
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(12px);
  border-radius: 24px;
  padding: clamp(1.5rem, 4vw, 3rem);
  border: 1px solid ${theme.colors.glass.border};
  box-shadow: var(--shadow-card);
`;

const fadeUpKeyframes = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Eyebrow = styled.div`
  animation: ${fadeUpKeyframes} 0.5s ease-out forwards;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${theme.colors.accent};
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 1px;
  margin-bottom: ${theme.spacing.md};
  background: ${theme.colors.glass.card};
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  border: 1px solid ${theme.colors.glass.border};
`;

const Title = styled.h1`
  animation: ${fadeUpKeyframes} 0.5s ease-out 0.1s forwards;
  opacity: 0;
  font-size: clamp(2.2rem, 5.5vw, 4.2rem);
  margin-bottom: ${theme.spacing.sm};
  color: ${theme.colors.light};
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -1px;
`;

const Subtitle = styled.h2`
  animation: ${fadeUpKeyframes} 0.5s ease-out 0.2s forwards;
  opacity: 0;
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.accent};
  font-weight: 600;
`;

const Description = styled.p`
  animation: ${fadeUpKeyframes} 0.5s ease-out 0.35s forwards;
  opacity: 0;
  font-size: clamp(1rem, 1.2vw, 1.15rem);
  max-width: 820px;
  margin-bottom: ${theme.spacing.lg};
  color: var(--color-muted);
  line-height: 1.7;
`;

const TechBadges = styled.div`
  animation: ${fadeUpKeyframes} 0.5s ease-out 0.45s forwards;
  opacity: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: ${theme.spacing.xl};
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: ${theme.colors.glass.card};
  border: 1px solid ${theme.colors.glass.border};
  color: ${theme.colors.light};
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 600;

  svg {
    color: ${theme.colors.accent};
    font-size: 1.1rem;
  }
`;

const ActionGroup = styled.div`
  animation: ${fadeUpKeyframes} 0.5s ease-out 0.55s forwards;
  opacity: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: 0.8rem 1.4rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  color: ${(props) => (props.variant === 'primary' ? theme.colors.textDark : theme.colors.textLight)};
  background: ${(props) => (props.variant === 'primary' ? theme.colors.gradient.accent : theme.colors.glass.card)};
  border: 1px solid ${(props) => (props.variant === 'primary' ? 'transparent' : theme.colors.glass.border)};
  transition: all ${theme.transitions.default};

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card);
  }
`;

const scrollToSection = (sectionId: string) => {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
};

export const Hero = () => {
  return (
    <HeroSection id="hero" role="region" aria-label="Inicio">
      <div className="container-fluid px-3 px-md-4">
        <HeroContent>
          <Eyebrow>
            <FaCode /> Portfolio Personal
          </Eyebrow>
          <Title>Desarrollo Web, Algoritmos & IA</Title>
          <Subtitle>{profile.headline}</Subtitle>
          <Description>{profile.summary}</Description>

          <TechBadges>
            <Badge><SiCplusplus /> C++</Badge>
            <Badge><SiTypescript /> TypeScript</Badge>
            <Badge><FaReact /> React</Badge>
            <Badge><FaNodeJs /> Node.js</Badge>
            <Badge><SiPython /> Python</Badge>
            <Badge><SiSqlite /> SQL</Badge>
            <Badge><FaDocker /> Docker</Badge>
            <Badge><FaGitAlt /> Git</Badge>
            <Badge><FaLinux /> Linux</Badge>
          </TechBadges>

          <ActionGroup>
            <ActionButton type="button" variant="primary" onClick={() => scrollToSection('projects')}>
              Ver proyectos <FaArrowDown aria-hidden="true" />
            </ActionButton>
            <ActionButton type="button" onClick={() => scrollToSection('skills')}>
              Ver tecnologías <FaServer aria-hidden="true" />
            </ActionButton>
          </ActionGroup>
        </HeroContent>
      </div>
    </HeroSection>
  );
};
