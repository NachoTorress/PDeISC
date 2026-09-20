import { lazy, Suspense } from 'react';
import styled from '@emotion/styled';
import { Hero } from '../components/sections/Hero';
import { theme } from '../styles/theme';

const About = lazy(() => import('../components/sections/About'));
const Projects = lazy(() => import('../components/sections/Projects'));
const Skills = lazy(() => import('../components/sections/Skills'));
const Contact = lazy(() => import('../components/sections/Contact'));

const LoadingFallback = styled.div`
  min-height: 40vh;
  display: grid;
  place-items: center;
  color: ${theme.colors.accent};
  font-size: 1rem;
`;

export const PortfolioPage = () => (
  <>
    <Hero />
    <Suspense fallback={<LoadingFallback>Cargando sección...</LoadingFallback>}>
      <About />
      <Projects />
      <Skills />
      <Contact />
    </Suspense>
  </>
);
