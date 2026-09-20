import type { ReactNode } from 'react';
import { Navbar, type StateScreen } from './Navbar';
import { ScrollTopButton } from './ScrollTopButton';

interface LayoutProps {
  children: ReactNode;
  currentScreen?: StateScreen;
  onNavigateScreen?: (screen: StateScreen) => void;
}

export function Layout({ children, currentScreen, onNavigateScreen }: LayoutProps) {
  return (
    <div className="app-shell">
      <Navbar currentScreen={currentScreen} onNavigateScreen={onNavigateScreen} />
      <main className="container app-main">{children}</main>
      <footer className="app-footer">
        <span>API + React (useState) + SQL · Contraseñas hasheadas · Estado Local</span>
      </footer>
      <ScrollTopButton />
    </div>
  );
}
