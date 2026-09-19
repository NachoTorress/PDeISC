import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { ScrollTopButton } from './ScrollTopButton';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="container app-main">{children}</main>
      <footer className="app-footer">
        <span>API + React + SQL · Contraseñas hasheadas · Rutas protegidas</span>
      </footer>
      <ScrollTopButton />
    </div>
  );
}

