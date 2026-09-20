import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { FaArrowDown, FaCode } from 'react-icons/fa';
import { profile } from '../../data/portfolio';
import { theme } from '../../styles/theme';

const HeroSection = styled.section`
  min-height: calc(100vh - 4.5rem);
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  color: ${theme.colors.textLight};
  padding: ${theme.spacing.lg} 0;

  @media (min-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing.xl} 0;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1060px;
  width: 100%;
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(8px);
  border-radius: 20px;
  padding: ${theme.spacing.lg};
  border: 1px solid ${theme.colors.glass.border};
  box-shadow: var(--shadow-card);

  @media (min-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing.xl};
  }
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

const Eyebrow = styled.p`
  animation: ${fadeUpKeyframes} 0.5s ease-out forwards;
  color: ${theme.colors.accent};
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.9rem;
  margin-bottom: ${theme.spacing.md};
`;

const Title = styled.h1`
  animation: ${fadeUpKeyframes} 0.5s ease-out 0.1s forwards;
  opacity: 0;
  font-size: clamp(2.15rem, 5.6vw, 4.5rem);
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.light};
  line-height: 1.1;
`;

const Subtitle = styled.h2`
  animation: ${fadeUpKeyframes} 0.5s ease-out 0.2s forwards;
  opacity: 0;
  font-size: clamp(1.25rem, 2.6vw, 2rem);
  margin-bottom: ${theme.spacing.lg};
  color: ${theme.colors.textLight};
  font-weight: 500;
`;

const Description = styled.p`
  animation: ${fadeUpKeyframes} 0.5s ease-out 0.35s forwards;
  opacity: 0;
  font-size: clamp(1rem, 1.2vw, 1.15rem);
  max-width: 760px;
  margin-bottom: ${theme.spacing.xl};
  color: var(--color-muted);
  line-height: 1.8;
`;

const ActionGroup = styled.div`
  animation: ${fadeUpKeyframes} 0.5s ease-out 0.5s forwards;
  opacity: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: 0.85rem 1.15rem;
  border-radius: 999px;
  font-weight: 700;
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
      <div className="container">
        <HeroContent className="row align-items-center g-4">
          <div className="col-12 col-lg-9">
            <Eyebrow>Portfolio personal</Eyebrow>
            <Title>Informática, algoritmos, IA y hardware</Title>
            <Subtitle>{profile.headline}</Subtitle>
            <Description>{profile.summary}</Description>
            <ActionGroup>
              <ActionButton type="button" variant="primary" onClick={() => scrollToSection('projects')}>
                Ver proyectos
                <FaArrowDown aria-hidden="true" />
              </ActionButton>
              <ActionButton type="button" onClick={() => scrollToSection('skills')}>
                Ver tecnologías
                <FaCode aria-hidden="true" />
              </ActionButton>
            </ActionGroup>
          </div>
        </HeroContent>
      </div>
    </HeroSection>
  );
};
