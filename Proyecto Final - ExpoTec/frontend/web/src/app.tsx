import { useEffect, useRef, useState } from 'react';
import {
  MapTrifoldIcon,
  SquaresFourIcon,
  HandCoinsIcon,
  PackageIcon,
  CompassIcon,
  TelevisionIcon,
  MoonIcon,
  SunIcon,
  ListIcon,
  XIcon,
  ArrowUpIcon,
  GraduationCapIcon,
  FlaskIcon,
  CheckCircleIcon,
} from '@phosphor-icons/react';
import { DemoProvider } from './contexts/DemoContext';
import { useDemo } from './hooks/useDemo';
import { useTheme } from './hooks/useTheme';
import { useIsMobile } from './hooks/useIsMobile';
import type { Page, Role } from './lib/types';
import { isProjectMember } from './lib/team';
import MapPage from './pages/MapPage';
import ProjectsPage from './pages/ProjectsPage';
import LoansPage from './pages/LoansPage';
import InventoryPage from './pages/InventoryPage';
import GalleryPage from './pages/GalleryPage';
import PresentationPage from './pages/PresentationPage';
import ProjectDialog from './components/ProjectDialog';

const roles: { value: Role; label: string; name: string }[] = [
  { value: 'admin', label: 'Organización', name: 'Ana López' },
  { value: 'student', label: 'Alumno', name: 'Lucía Fernández' },
  { value: 'teacher', label: 'Profesor', name: 'Martín García' },
  { value: 'loans', label: 'Encargado de préstamos', name: 'Sofía Pérez' },
  { value: 'guest', label: 'Invitado', name: 'Visitante' },
];
const navigation = [
  { id: 'map' as Page, label: 'Mapa de espacios', icon: MapTrifoldIcon },
  { id: 'projects' as Page, label: 'Proyectos', icon: SquaresFourIcon },
  { id: 'loans' as Page, label: 'Préstamos', icon: HandCoinsIcon },
  { id: 'inventory' as Page, label: 'Inventario', icon: PackageIcon },
  { id: 'gallery' as Page, label: 'Muestra pública', icon: CompassIcon },
  { id: 'tv' as Page, label: 'Presentación en TV', icon: TelevisionIcon },
];

function Shell() {
  const { state, role, setRole, notice } = useDemo();
  const { theme, toggleTheme } = useTheme();
  const [page, setPage] = useState<Page>('map');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const isMobile = useIsMobile();
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const profile = roles.find((r) => r.value === role)!;
  const items = navigation.filter((item) =>
    role === 'guest'
      ? ['map', 'gallery', 'tv'].includes(item.id)
      : ['loans', 'inventory'].includes(item.id)
        ? ['admin', 'loans'].includes(role)
        : true,
  );
  const currentPage = items.some((item) => item.id === page) ? page : 'gallery';
  const pendingCount = state.projects.filter(
    (p) =>
      p.status === 'pending' &&
      (role === 'admin' ||
        (role === 'teacher' && p.teachers.includes('Martín García')) ||
        (role === 'student' && isProjectMember(p, profile.name))),
  ).length;
  const activeProject = state.projects.find(
    (p) =>
      p.id === selectedProject &&
      (p.status === 'approved' ||
        role === 'admin' ||
        (role === 'student' && isProjectMember(p, profile.name)) ||
        (role === 'teacher' && p.teachers.includes(profile.name))),
  );
  const openProject = (id: string) => setSelectedProject(id);
  function navigate(target: Page) {
    setPage(target);
    setMobileMenu(false);
    setCreating(false);
    window.scrollTo({ top: 0 });
  }
  function createProject() {
    setPage('projects');
    setCreating(true);
    setMobileMenu(false);
  }
  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > 450);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!isMobile || !mobileMenu) return;
    const sidebar = sidebarRef.current;
    const controls = sidebar?.querySelectorAll<HTMLButtonElement | HTMLSelectElement>(
      'button:not(:disabled), select',
    );
    const first = controls?.[0];
    const last = controls?.[controls.length - 1];
    const returnFocus = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    first?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileMenu(false);
      }
      if (event.key !== 'Tab') return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      returnFocus?.focus();
    };
  }, [isMobile, mobileMenu]);

  if (currentPage === 'tv')
    return (
      <>
        <PresentationPage onBack={() => navigate('gallery')} />
        <div className="demo-tv-label">Prototipo · proyectos de ejemplo</div>
        {notice && (
          <div className="toast-notice" role="status">
            <CheckCircleIcon size={20} />
            {notice}
          </div>
        )}
      </>
    );

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      {mobileMenu && (
        <button
          className="nav-scrim"
          aria-label="Cerrar menú"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        inert={isMobile && !mobileMenu}
        className={`app-sidebar ${mobileMenu ? 'menu-open' : ''}`}
        aria-label="Navegación principal"
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <GraduationCapIcon size={28} weight="bold" />
          </div>
          <span>
            expotec<span className="brand-dot">.</span>
            <small>Todo en su lugar</small>
          </span>
          <button
            className="mobile-close btn btn-quiet"
            onClick={() => setMobileMenu(false)}
            aria-label="Cerrar menú"
          >
            <XIcon size={22} />
          </button>
        </div>
        <div className="event-chip">
          <span className="event-dot" />
          <div>
            Edición de ejemplo<small>3 jornadas para compartir</small>
          </div>
        </div>
        <nav>
          {items.map((item) => (
            <button
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              aria-current={currentPage === item.id ? 'page' : undefined}
              onClick={() => navigate(item.id)}
              key={item.id}
            >
              <item.icon size={21} weight={currentPage === item.id ? 'duotone' : 'regular'} />
              <span>{item.label}</span>
              {item.id === 'projects' && pendingCount > 0 && (
                <span className="nav-count">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="prototype-note">
            <FlaskIcon size={22} />
            <div>
              <strong>Estamos dando forma</strong>
              <p>Probá las pantallas con datos de ejemplo. Los cambios quedan en este navegador.</p>
            </div>
          </div>
          <label className="demo-role-label" htmlFor="demo-role">
            Probar vista como
          </label>
          <select
            id="demo-role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as Role);
              setSelectedProject(undefined);
              setCreating(false);
              setMobileMenu(false);
            }}
          >
            {roles.map((r) => (
              <option value={r.value} key={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="profile-row">
            <div className="profile-avatar">
              {profile.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <strong>{profile.name}</strong>
              <small>{profile.label} · perfil de ejemplo</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-workspace" inert={isMobile && mobileMenu}>
        <header className="topbar">
          <div className="topbar-start">
            <button
              ref={menuButtonRef}
              className="mobile-toggle btn btn-quiet"
              aria-label="Abrir menú"
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(true)}
            >
              <ListIcon size={24} />
            </button>
            <span>Mi ExpoTec</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{items.find((item) => item.id === currentPage)?.label}</strong>
          </div>
          <div className="topbar-end">
            <span className="prototype-badge">
              <FlaskIcon size={15} /> Prototipo
            </span>
            <button
              className="theme-button"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
              title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {theme === 'light' ? <MoonIcon size={21} /> : <SunIcon size={21} />}
            </button>
            <span className="topbar-avatar">
              {profile.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
          </div>
        </header>
        <main id="main" className="main-content">
          {currentPage === 'map' && (
            <MapPage
              onSelectProject={openProject}
              onProjects={() => navigate(role === 'guest' ? 'gallery' : 'projects')}
              onNewProject={createProject}
            />
          )}
          {currentPage === 'projects' && (
            <ProjectsPage
              onSelect={openProject}
              creating={creating}
              onCreatingChange={setCreating}
            />
          )}
          {currentPage === 'loans' && <LoansPage />}
          {currentPage === 'inventory' && <InventoryPage />}
          {currentPage === 'gallery' && (
            <GalleryPage onSelect={openProject} onPresentation={() => navigate('tv')} />
          )}
          <footer className="page-footer">
            <span>ExpoTec · Hecho para que las ideas tengan lugar.</span>
            <span>Datos de ejemplo · sin conexión al servidor</span>
          </footer>
        </main>
      </div>
      <ProjectDialog project={activeProject} onClose={() => setSelectedProject(undefined)} />
      {notice && (
        <div className="toast-notice" role="status">
          <CheckCircleIcon size={20} />
          {notice}
        </div>
      )}
      {showTop && (
        <button
          className="back-to-top"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
            })
          }
          aria-label="Volver arriba"
        >
          <ArrowUpIcon size={21} />
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <DemoProvider>
      <Shell />
    </DemoProvider>
  );
}
