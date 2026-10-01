import styled from '@emotion/styled';
import { motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { theme } from '../../styles/theme';
import { useEffect, useState } from 'react';
import { FaArrowUp } from 'react-icons/fa';
import { navSections } from '../../data/portfolio';
import { useScrollVisibility } from '../../hooks/useScrollVisibility';

const NavContainer = styled(motion.nav)`
  position: fixed;
  right: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(12px);
  padding: 0.35rem;
  border-radius: 999px;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  box-shadow: var(--shadow-card);
  border: 1px solid ${theme.colors.glass.border};

  @media print {
    display: none;
  }

  @media (max-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

const NavDot = styled(motion.button)<{ active: boolean }>`
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 40px;
  border-radius: 50%;
  background: transparent;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background ${theme.transitions.default};

  &::after {
    content: '';
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: ${(props) => (props.active ? theme.colors.accent : theme.colors.secondary)};
    transition: transform ${theme.transitions.default}, background ${theme.transitions.default};
  }

  &:hover::after {
    background: ${theme.colors.accent};
    transform: scale(1.3);
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.accent};
    outline-offset: 3px;
  }

  &::before {
    content: attr(data-tooltip);
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%) translateX(6px);
    background: ${theme.colors.glass.background};
    backdrop-filter: blur(12px);
    color: ${theme.colors.light};
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border: 1px solid ${theme.colors.glass.border};
  }

  &:hover::before {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
`;

const ProgressBar = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    ${theme.colors.accent},
    ${theme.colors.accent}dd
  );
  transform-origin: 0%;
  z-index: 1000;
  box-shadow: 0 0 10px ${theme.colors.accent}80;

  @media print {
    display: none;
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    height: 2px;
  }
`;

const TopButton = styled(motion.button)`
  position: fixed;
  right: ${theme.spacing.lg};
  bottom: ${theme.spacing.lg};
  z-index: 1000;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textDark};
  background: ${theme.colors.gradient.accent};
  box-shadow: var(--shadow-card);

  @media print {
    display: none;
  }
`;

export const FloatingNav = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [progress, setProgress] = useState(0);
  const showTopButton = useScrollVisibility(600);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setProgress(Math.round(value * 100));
  });

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      
      navSections.forEach(({ id, name }) => {
        const element = document.getElementById(id);
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          if (top <= windowHeight / 2 && bottom >= windowHeight / 2) {
            setActiveSection(id);
            const liveRegion = document.getElementById('section-announcer');
            if (liveRegion) {
              liveRegion.textContent = `Sección actual: ${name}`;
            }
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, sectionId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const currentIndex = navSections.findIndex(({ id }) => id === sectionId);
      const nextIndex = e.key === 'ArrowUp' 
        ? Math.max(0, currentIndex - 1)
        : Math.min(navSections.length - 1, currentIndex + 1);
      
      const nextSection = navSections[nextIndex];
      document.getElementById(nextSection.id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <ProgressBar 
        style={{ scaleX }} 
        role="progressbar" 
        aria-label="Progreso de lectura"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      />
      <div 
        id="section-announcer" 
        className="sr-only" 
        role="status" 
        aria-live="polite"
      />
      <NavContainer
        role="navigation"
        aria-label="Navegación por secciones"
      >
        {navSections.map(({ id, name }) => (
          <NavDot
            key={id}
          type="button"
            active={activeSection === id}
            onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
            onKeyDown={(e) => handleKeyDown(e, id)}
            data-tooltip={name}
            tabIndex={0}
            aria-label={`${name}${activeSection === id ? ', sección actual' : ', ir a la sección'}`}
            aria-current={activeSection === id ? 'location' : undefined}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </NavContainer>
      {showTopButton && (
        <TopButton
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Volver arriba"
          title="Volver arriba"
        >
          <FaArrowUp aria-hidden="true" />
        </TopButton>
      )}
    </>
  );
};
