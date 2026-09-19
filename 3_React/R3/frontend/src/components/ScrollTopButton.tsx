import { ArrowUp } from 'lucide-react';
import { useScrollTop } from '../hooks/useScrollTop';

export function ScrollTopButton() {
  const { visible, scrollToTop } = useScrollTop();

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      className="btn btn-primary floating-scroll-top"
      onClick={scrollToTop}
      title="Subir al inicio"
    >
      <ArrowUp size={20} />
    </button>
  );
}

