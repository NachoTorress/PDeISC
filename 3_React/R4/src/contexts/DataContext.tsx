/**
 * Data Context for Portfolio Dynamic State & REST API Synchronization.
 * Supports full CRUD (Create, Read, Update, Delete) operations and fallback data persistence.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import portfolioData from '../data/portfolio.json';

export interface SkillItemData {
  id: string | number;
  name: string;
  icon: string;
  createdAt?: string;
}

export interface SkillCategoryData {
  id: string | number;
  title: string;
  icon: string;
  skills: SkillItemData[];
}

export interface ProjectData {
  id: string | number;
  title: string;
  description: string;
  tags: string[];
  accent: string;
  githubUrl?: string;
  createdAt?: string;
}

export interface ItemData {
  id: string | number;
  title: string;
  description: string;
  meta?: string;
  type?: 'education' | 'work';
  createdAt?: string;
}

interface DataContextType {
  skillCategories: SkillCategoryData[];
  projects: ProjectData[];
  education: ItemData[];
  achievements: ItemData[];
  addSkill: (categoryId: string | number, name: string, icon?: string) => Promise<void>;
  deleteSkill: (skillId: string | number) => Promise<void>;
  addProject: (project: Omit<ProjectData, 'id'>) => Promise<void>;
  deleteProject: (id: string | number) => Promise<void>;
  addExperience: (exp: Omit<ItemData, 'id'>) => Promise<void>;
  deleteExperience: (id: string | number) => Promise<void>;
  addAchievement: (ach: Omit<ItemData, 'id'>) => Promise<void>;
  deleteAchievement: (id: string | number) => Promise<void>;
  recordDownload: (fileName: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_BASE = '/api';

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [skillCategories, setSkillCategories] = useState<SkillCategoryData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [education, setEducation] = useState<ItemData[]>([]);
  const [achievements, setAchievements] = useState<ItemData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skillsRes, projRes, expRes, achRes] = await Promise.all([
          fetch(`${API_BASE}/skills`),
          fetch(`${API_BASE}/projects`),
          fetch(`${API_BASE}/experiences`),
          fetch(`${API_BASE}/achievements`),
        ]);

        if (skillsRes.ok && projRes.ok && expRes.ok && achRes.ok) {
          const skillsData = await skillsRes.json();
          const projData = await projRes.json();
          const expData = await expRes.json();
          const achData = await achRes.json();

          setSkillCategories(
            skillsData.map((cat: any) => ({
              id: cat.id,
              title: cat.title,
              icon: cat.icon || 'code',
              skills: (cat.skills || []).map((s: any) => ({
                id: s.id,
                name: s.name,
                icon: s.icon,
              })),
            }))
          );

          setProjects(
            projData.map((p: any) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              accent: p.accent,
              githubUrl: p.github_url || undefined,
              tags: p.tags || [],
            }))
          );

          setEducation(
            expData.map((e: any) => ({
              id: e.id,
              title: e.title,
              description: e.description,
              meta: e.meta,
              type: e.type,
            }))
          );

          setAchievements(
            achData.map((a: any) => ({
              id: a.id,
              title: a.title,
              description: a.description,
            }))
          );
          return;
        }
      } catch {}

      setSkillCategories(
        (portfolioData.skillCategories as any[]).map((cat, index) => ({
          id: index + 1,
          title: cat.title,
          icon: cat.icon,
          skills: cat.skills.map((s: any, sIdx: number) => ({
            id: `s-${index}-${sIdx}`,
            name: s.name,
            icon: s.icon,
          })),
        }))
      );

      setProjects(
        (portfolioData.projects as any[]).map((p, idx) => ({
          id: p.id || idx + 1,
          title: p.title,
          description: p.description,
          accent: p.accent,
          githubUrl: p.githubUrl,
          tags: p.tags,
        }))
      );

      setEducation(
        (portfolioData.education as any[]).map((e, idx) => ({
          id: e.id || idx + 1,
          title: e.title,
          description: e.description,
          meta: e.meta,
          type: 'education',
        }))
      );

      setAchievements(
        (portfolioData.achievements as any[]).map((a, idx) => ({
          id: a.id || idx + 1,
          title: a.title,
          description: a.description,
        }))
      );
    };

    fetchData();
  }, []);

  const addSkill = async (categoryId: string | number, name: string, icon = 'code') => {
    try {
      const res = await fetch(`${API_BASE}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId, name, icon }),
      });
      if (res.ok) {
        const created = await res.json();
        setSkillCategories((prev) =>
          prev.map((cat) =>
            cat.id === categoryId
              ? {
                  ...cat,
                  skills: [...cat.skills, { id: created.id, name: created.name, icon: created.icon }],
                }
              : cat
          )
        );
        return;
      }
    } catch {}

    setSkillCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              skills: [...cat.skills, { id: Date.now(), name, icon }],
            }
          : cat
      )
    );
  };

  const deleteSkill = async (skillId: string | number) => {
    try {
      await fetch(`${API_BASE}/skills/${skillId}`, { method: 'DELETE' });
    } catch {}
    setSkillCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        skills: cat.skills.filter((s) => s.id !== skillId),
      }))
    );
  };

  const addProject = async (project: Omit<ProjectData, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          description: project.description,
          accent: project.accent,
          github_url: project.githubUrl,
          tags: project.tags,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setProjects((prev) => [
          { ...created, githubUrl: created.github_url || undefined },
          ...prev,
        ]);
        return;
      }
    } catch {}

    setProjects((prev) => [{ id: Date.now(), ...project }, ...prev]);
  };

  const deleteProject = async (id: string | number) => {
    try {
      await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    } catch {}
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const addExperience = async (exp: Omit<ItemData, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE}/experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: exp.type || 'education',
          title: exp.title,
          description: exp.description,
          meta: exp.meta,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setEducation((prev) => [...prev, created]);
        return;
      }
    } catch {}

    setEducation((prev) => [...prev, { id: Date.now(), ...exp }]);
  };

  const deleteExperience = async (id: string | number) => {
    try {
      await fetch(`${API_BASE}/experiences/${id}`, { method: 'DELETE' });
    } catch {}
    setEducation((prev) => prev.filter((e) => e.id !== id));
  };

  const addAchievement = async (ach: Omit<ItemData, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE}/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: ach.title, description: ach.description }),
      });
      if (res.ok) {
        const created = await res.json();
        setAchievements((prev) => [...prev, created]);
        return;
      }
    } catch {}

    setAchievements((prev) => [...prev, { id: Date.now(), ...ach }]);
  };

  const deleteAchievement = async (id: string | number) => {
    try {
      await fetch(`${API_BASE}/achievements/${id}`, { method: 'DELETE' });
    } catch {}
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  const recordDownload = async (fileName: string) => {
    try {
      await fetch(`${API_BASE}/download/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });
    } catch {}
  };

  return (
    <DataContext.Provider
      value={{
        skillCategories,
        projects,
        education,
        achievements,
        addSkill,
        deleteSkill,
        addProject,
        deleteProject,
        addExperience,
        deleteExperience,
        addAchievement,
        deleteAchievement,
        recordDownload,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe ser usado dentro de un DataProvider');
  }
  return context;
};
