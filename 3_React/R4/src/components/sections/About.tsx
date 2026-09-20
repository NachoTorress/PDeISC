import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import { FaMedal, FaSchool } from 'react-icons/fa';
import { achievements, education } from '../../data/portfolio';
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
  padding-left: 1.1rem;
  color: var(--color-muted);

  li + li {
    margin-top: ${theme.spacing.sm};
  }
`;

const About = () => (
  <AboutSection id="about" role="region" aria-label="Sobre mí">
    <div className="container">
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
            <FaSchool aria-hidden="true" />
            <h3>Formación</h3>
            <InfoList>
              {education.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}:</strong> {item.description} {item.meta}
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
            <FaMedal aria-hidden="true" />
            <h3>Competencias y participación</h3>
            <InfoList>
              {achievements.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}:</strong> {item.description}
                </li>
              ))}
            </InfoList>
          </InfoCard>
        </div>
      </div>
    </div>
  </AboutSection>
);

export default About;
