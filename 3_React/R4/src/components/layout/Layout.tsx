import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';
import { FaBars, FaMoon, FaSun, FaTimes } from 'react-icons/fa';
import { theme } from '../../styles/theme';
import { FloatingNav } from '../navigation/FloatingNav';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useThemeMode } from '../../hooks/useThemeMode';
import { navSections } from '../../data/portfolio';

interface LayoutProps {
  children: ReactNode;
}

const LayoutWrapper = styled.div`
  @media print {
    background: white !important;
    color: black !important;
    
    * {
      color: black !important;
      text-shadow: none !important;
      box-shadow: none !important;
    }

    section {
      min-height: auto !important;
      padding: 2rem 0 !important;
      page-break-inside: avoid;
    }

    a[href]:after {
      content: " (" attr(href) ")";
      font-size: 0.8em;
    }
  }

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  position: relative;
  background: transparent;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at 70% 30%,
      ${theme.colors.accent}15 0%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 0;
  }
`;

const Header = styled.header`
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(8px);
  padding: ${theme.spacing.md} 0;
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;

  @media print {
    display: none;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 0;
    right: 0;
    height: 20px;
    background: linear-gradient(to bottom, ${theme.colors.glass.background}, transparent);
  }
`;

const Nav = styled.nav`
  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 ${theme.spacing.md};
    max-width: 1200px;
    margin: 0 auto;
    width: 90%;
  }
`;

const Logo = styled(motion.div)`
  color: ${theme.colors.light};
  font-family: ${theme.fonts.heading};
  font-size: clamp(1.05rem, 3vw, 1.5rem);
  font-weight: 700;
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const IconButton = styled.button`
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: ${theme.colors.textLight};
  background: ${theme.colors.glass.card};
  border: 1px solid ${theme.colors.glass.border};
  transition: all ${theme.transitions.default};

  &:hover {
    color: ${theme.colors.light};
    transform: translateY(-2px);
    box-shadow: var(--shadow-card);
  }
`;

const NavLinks = styled.div<{ open: boolean }>`
  display: flex;
  gap: ${theme.spacing.lg};

  a {
    color: ${theme.colors.textLight};
    transition: all ${theme.transitions.default};
    font-weight: 500;
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    border-radius: 4px;

    &:hover {
      color: ${theme.colors.light};
      background-color: ${theme.colors.glass.card};
    }
  }

  @media (max-width: ${theme.breakpoints.md}) {
    position: fixed;
    top: 4.5rem;
    left: 0;
    right: 0;
    display: ${(props) => (props.open ? 'flex' : 'none')};
    flex-direction: column;
    gap: ${theme.spacing.sm};
    padding: ${theme.spacing.md};
    background: ${theme.colors.glass.background};
    border-bottom: 1px solid ${theme.colors.glass.border};
    box-shadow: var(--shadow-card);

    a {
      width: 100%;
      padding: ${theme.spacing.md};
    }
  }
`;

const Main = styled.main`
  flex: 1;
  margin-top: 4.5rem;
  width: 100%;
  overflow-x: hidden;
`;

const SkipLink = styled.a`
  position: absolute;
  top: -40px;
  left: 0;
  background: ${theme.colors.accent};
  color: ${theme.colors.textDark};
  padding: ${theme.spacing.sm};
  z-index: 9999;
  transition: top 0.2s;

  &:focus {
    top: 0;
  }
`;

const Footer = styled.footer`
  background: ${theme.colors.glass.background};
  backdrop-filter: blur(8px);
  color: ${theme.colors.textLight};
  padding: ${theme.spacing.lg} 0;
  text-align: center;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: 0;
    right: 0;
    height: 20px;
    background: linear-gradient(to top, ${theme.colors.glass.background}, transparent);
  }
`;

export const Layout = ({ children }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { themeMode, toggleTheme } = useThemeMode();
  useKeyboardNavigation();

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <LayoutWrapper>
      <SkipLink href="#main-content">
        Saltar al contenido principal
      </SkipLink>

      <Header role="banner">
        <Nav role="navigation" aria-label="Main navigation">
          <div className="container">
            <Logo
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              role="heading"
              aria-level={1}
            >
              Portfolio personal
            </Logo>
            <NavActions>
              <NavLinks open={isMenuOpen} role="list">
                {navSections.slice(1).map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    role="listitem"
                    aria-label={`Ir a ${section.name}`}
                    onClick={closeMenu}
                  >
                    {section.name}
                  </a>
                ))}
              </NavLinks>
              <IconButton
                type="button"
                onClick={toggleTheme}
                aria-label={themeMode === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                title={themeMode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                {themeMode === 'dark' ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
              </IconButton>
              <IconButton
                type="button"
                className="d-inline-flex d-md-none"
                onClick={() => setIsMenuOpen((current) => !current)}
                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
              </IconButton>
            </NavActions>
          </div>
        </Nav>
      </Header>
      <Main id="main-content" role="main" tabIndex={-1}>
        {children}
      </Main>
      <FloatingNav />
      <Footer role="contentinfo">
        <div className="container">
          <p>© {new Date().getFullYear()} Portfolio personal. Construido con React, Vite y TypeScript.</p>
        </div>
      </Footer>
    </LayoutWrapper>
  );
};
