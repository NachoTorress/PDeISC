/**
 * Layout Component for Portfolio Application.
 * Includes Header, Navigation, Admin Access trigger, Theme Mode Toggle, Footer, and Floating Navigation.
 */
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { ReactNode, useState } from 'react';
import { FaBars, FaMoon, FaSun, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { theme } from '../../styles/theme';
import { FloatingNav } from '../navigation/FloatingNav';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLoginModal } from '../admin/AdminLoginModal';
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
  backdrop-filter: blur(12px);
  padding: 0.85rem 0;
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid ${theme.colors.glass.border};

  @media print {
    display: none;
  }
`;

const Nav = styled.nav`
  .container-fluid {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1.5rem;
    width: 100%;
    max-width: 1320px;
    margin: 0 auto;
  }
`;

const Logo = styled(motion.div)`
  color: ${theme.colors.light};
  font-family: ${theme.fonts.heading};
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
  font-weight: 700;
  letter-spacing: -0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const IconButton = styled.button<{ active?: boolean }>`
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: ${(props) => (props.active ? theme.colors.textDark : theme.colors.textLight)};
  background: ${(props) => (props.active ? theme.colors.gradient.accent : theme.colors.glass.card)};
  border: 1px solid ${(props) => (props.active ? 'transparent' : theme.colors.glass.border)};
  transition: all ${theme.transitions.default};
  cursor: pointer;

  &:hover {
    color: ${(props) => (props.active ? theme.colors.textDark : theme.colors.light)};
    transform: translateY(-2px);
    box-shadow: var(--shadow-card);
  }
`;

const NavLinks = styled.div<{ open: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};

  a {
    color: ${theme.colors.textLight};
    transition: all ${theme.transitions.default};
    font-weight: 600;
    font-size: 0.92rem;
    padding: 0.4rem 0.75rem;
    border-radius: 8px;

    &:hover {
      color: ${theme.colors.light};
      background-color: ${theme.colors.glass.card};
    }
  }

  @media (max-width: ${theme.breakpoints.md}) {
    position: fixed;
    top: 4.2rem;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.25rem 1rem;
    background: #ffffff;
    border-bottom: 2px solid ${theme.colors.accent};
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    opacity: ${(props) => (props.open ? 1 : 0)};
    visibility: ${(props) => (props.open ? 'visible' : 'hidden')};
    transform: ${(props) => (props.open ? 'translateY(0)' : 'translateY(-10px)')};
    transition: all ${theme.transitions.default};
    pointer-events: ${(props) => (props.open ? 'auto' : 'none')};

    a {
      width: 100%;
      padding: 0.85rem 1rem;
      text-align: center;
      color: #0f172a !important;
      font-weight: 700;
      font-size: 1.05rem;
      background: #f1f5f9;
      border-radius: 10px;

      &:hover, &:focus {
        background: ${theme.colors.accent};
        color: #0f172a !important;
      }
    }
  }
`;

const Main = styled.main`
  flex: 1;
  margin-top: 4.2rem;
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
  border-top: 1px solid ${theme.colors.glass.border};
`;

export const Layout = ({ children }: LayoutProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { themeMode, toggleTheme } = useThemeMode();
  const { isAdmin, logout } = useAuth();
  useKeyboardNavigation();

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <LayoutWrapper>
      <SkipLink href="#main-content">Saltar al contenido principal</SkipLink>

      <Header role="banner">
        <Nav role="navigation" aria-label="Navegación principal">
          <div className="container-fluid">
            <Logo
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              role="heading"
              aria-level={1}
            >
              Ignacio Torres
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
              {isAdmin && (
                <IconButton
                  type="button"
                  onClick={logout}
                  aria-label="Cerrar sesión de administrador"
                  title="Cerrar sesión de administrador"
                  style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                >
                  <FaSignOutAlt aria-hidden="true" />
                </IconButton>
              )}
              <IconButton
                type="button"
                onClick={toggleTheme}
                aria-label={themeMode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
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
      <AdminLoginModal />
      <Footer role="contentinfo">
        <div className="container-fluid">
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            © {new Date().getFullYear()} Portfolio Personal. React, Vite & Node.js.
          </p>
        </div>
      </Footer>
    </LayoutWrapper>
  );
};
