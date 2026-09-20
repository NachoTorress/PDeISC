import { IconType } from 'react-icons';
import {
  FaBrain,
  FaCode,
  FaDocker,
  FaGitAlt,
  FaLinux,
  FaMicrochip,
  FaNodeJs,
  FaReact,
} from 'react-icons/fa';
import { SiCplusplus, SiPython, SiSqlite, SiTypescript } from 'react-icons/si';
import portfolioData from './portfolio.json';

type IconKey =
  | 'brain'
  | 'code'
  | 'cplusplus'
  | 'docker'
  | 'git'
  | 'linux'
  | 'microchip'
  | 'node'
  | 'python'
  | 'react'
  | 'sql'
  | 'typescript';

interface JsonSkill {
  name: string;
  icon: IconKey;
}

interface JsonSkillCategory {
  id: string;
  title: string;
  icon: IconKey;
  skills: JsonSkill[];
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  tags: string[];
  accent: string;
  githubUrl?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  meta?: string;
}

export interface SkillCategory {
  id: string;
  title: string;
  icon: IconType;
  skills: Array<{
    name: string;
    icon: IconType;
  }>;
}

const iconRegistry: Record<IconKey, IconType> = {
  brain: FaBrain,
  code: FaCode,
  cplusplus: SiCplusplus,
  docker: FaDocker,
  git: FaGitAlt,
  linux: FaLinux,
  microchip: FaMicrochip,
  node: FaNodeJs,
  python: SiPython,
  react: FaReact,
  sql: SiSqlite,
  typescript: SiTypescript,
};

/**
 * Converts editable JSON skill categories into render-ready React data.
 * Source: src/data/portfolio.json. Destination: section components. Result: icons are resolved safely.
 */
const mapSkillCategory = (category: JsonSkillCategory): SkillCategory => ({
  ...category,
  icon: iconRegistry[category.icon] ?? FaCode,
  skills: category.skills.map((skill) => ({
    ...skill,
    icon: iconRegistry[skill.icon] ?? FaCode,
  })),
});

export const profile = portfolioData.profile;
export const education = portfolioData.education satisfies PortfolioItem[];
export const achievements = portfolioData.achievements satisfies PortfolioItem[];
export const projects = portfolioData.projects satisfies PortfolioProject[];
export const skillCategories = (portfolioData.skillCategories as JsonSkillCategory[]).map(mapSkillCategory);
export const navSections = portfolioData.navSections;
