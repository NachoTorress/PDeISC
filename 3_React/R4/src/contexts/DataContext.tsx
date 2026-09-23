/**
 * Data Context for Portfolio Dynamic State & REST API Synchronization.
 * Supports full CRUD (Create, Read, Update, Delete) operations with instant optimistic UI updates
 * and automatic fallback persistence.
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
  updateSkill: (skillId: string | number, name: string, icon?: string) => Promise<void>;
  deleteSkill: (skillId: string | number) => Promise<void>;
  addProject: (project: Omit<ProjectData, 'id'>) => Promise<void>;
  updateProject: (id: string | number, project: Omit<ProjectData, 'id'>) => Promise<void>;
  deleteProject: (id: string | number) => Promise<void>;
  addExperience: (exp: Omit<ItemData, 'id'>) => Promise<void>;
  updateExperience: (id: string | number, exp: Omit<ItemData, 'id'>) => Promise<void>;
  deleteExperience: (id: string | number) => Promise<void>;
  addAchievement: (ach: Omit<ItemData, 'id'>) => Promise<void>;
  updateAchievement: (id: string | number, ach: Omit<ItemData, 'id'>) => Promise<void>;
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

    const syncFromAPI = async () => {
      try {
        const [skillsRes, projRes, expRes, achRes] = await Promise.all([
          fetch(`${API_BASE}/skills`),
          fetch(`${API_BASE}/projects`),
          fetch(`${API_BASE}/experiences`),
          fetch(`${API_BASE}/achievements`),
        ]);

        if (skillsRes.ok) {
          const skillsData = await skillsRes.json();
          if (Array.isArray(skillsData) && skillsData.length > 0) {
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
          }
        }

        if (projRes.ok) {
          const projData = await projRes.json();
          if (Array.isArray(projData) && projData.length > 0) {
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
          }
        }

        if (expRes.ok) {
          const expData = await expRes.json();
          if (Array.isArray(expData) && expData.length > 0) {
            setEducation(
              expData.map((e: any) => ({
                id: e.id,
                title: e.title,
                description: e.description,
                meta: e.meta,
                type: e.type,
              }))
            );
          }
        }

        if (achRes.ok) {
          const achData = await achRes.json();
          if (Array.isArray(achData) && achData.length > 0) {
            setAchievements(
              achData.map((a: any) => ({
                id: a.id,
                title: a.title,
                description: a.description,
              }))
            );
          }
        }
      } catch {}
    };

    syncFromAPI();
  }, []);

  const addSkill = async (categoryId: string | number, name: string, icon = 'code') => {
    const newId = Date.now();
    setSkillCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              skills: [...cat.skills, { id: newId, name, icon }],
            }
          : cat
      )
    );

    try {
      await fetch(`${API_BASE}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId, name, icon }),
      });
    } catch {}
  };

  const updateSkill = async (skillId: string | number, name: string, icon = 'code') => {
    setSkillCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        skills: cat.skills.map((s) => (s.id === skillId ? { ...s, name, icon } : s)),
      }))
    );

    try {
      await fetch(`${API_BASE}/skills/${skillId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon }),
      });
    } catch {}
  };

  const deleteSkill = async (skillId: string | number) => {
    setSkillCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        skills: cat.skills.filter((s) => s.id !== skillId),
      }))
    );

    try {
      await fetch(`${API_BASE}/skills/${skillId}`, { method: 'DELETE' });
    } catch {}
  };

  const addProject = async (project: Omit<ProjectData, 'id'>) => {
    const newId = Date.now();
    setProjects((prev) => [{ id: newId, ...project }, ...prev]);

    try {
      await fetch(`${API_BASE}/projects`, {
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
    } catch {}
  };

  const updateProject = async (id: string | number, project: Omit<ProjectData, 'id'>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...project } : p)));

    try {
      await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          description: project.description,
          accent: project.accent,
          github_url: project.githubUrl,
          tags: project.tags,
        }),
      });
    } catch {}
  };

  const deleteProject = async (id: string | number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
    } catch {}
  };

  const addExperience = async (exp: Omit<ItemData, 'id'>) => {
    const newId = Date.now();
    setEducation((prev) => [...prev, { id: newId, ...exp }]);

    try {
      await fetch(`${API_BASE}/experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: exp.type || 'education',
          title: exp.title,
          description: exp.description,
          meta: exp.meta,
        }),
      });
    } catch {}
  };

  const updateExperience = async (id: string | number, exp: Omit<ItemData, 'id'>) => {
    setEducation((prev) => prev.map((e) => (e.id === id ? { ...e, ...exp } : e)));

    try {
      await fetch(`${API_BASE}/experiences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: exp.type || 'education',
          title: exp.title,
          description: exp.description,
          meta: exp.meta,
        }),
      });
    } catch {}
  };

  const deleteExperience = async (id: string | number) => {
    setEducation((prev) => prev.filter((e) => e.id !== id));
    try {
      await fetch(`${API_BASE}/experiences/${id}`, { method: 'DELETE' });
    } catch {}
  };

  const addAchievement = async (ach: Omit<ItemData, 'id'>) => {
    const newId = Date.now();
    setAchievements((prev) => [...prev, { id: newId, ...ach }]);

    try {
      await fetch(`${API_BASE}/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: ach.title, description: ach.description }),
      });
    } catch {}
  };

  const updateAchievement = async (id: string | number, ach: Omit<ItemData, 'id'>) => {
    setAchievements((prev) => prev.map((a) => (a.id === id ? { ...a, ...ach } : a)));

    try {
      await fetch(`${API_BASE}/achievements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: ach.title, description: ach.description }),
      });
    } catch {}
  };

  const deleteAchievement = async (id: string | number) => {
    setAchievements((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`${API_BASE}/achievements/${id}`, { method: 'DELETE' });
    } catch {}
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
        updateSkill,
        deleteSkill,
        addProject,
        updateProject,
        deleteProject,
        addExperience,
        updateExperience,
        deleteExperience,
        addAchievement,
        updateAchievement,
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
