import { useEffect, useRef } from 'react';
import type { Project } from '../lib/types';
import ProjectDetail from './ProjectDetail';

export default function ProjectDialog({
  project,
  onClose,
}: {
  project: Project | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (project && !ref.current?.open) ref.current?.showModal();
    if (!project && ref.current?.open) ref.current?.close();
  }, [project]);
  return (
    <dialog
      ref={ref}
      className="project-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            onClose();
        }
      }}
      aria-label={project ? `Proyecto ${project.name}` : 'Proyecto'}
    >
      {project && <ProjectDetail project={project} onClose={onClose} />}
    </dialog>
  );
}
