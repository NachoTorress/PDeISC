import { RobotIcon, PlantIcon, LightningIcon, CloudSunIcon } from '@phosphor-icons/react';
import type { Project } from '../lib/types';

const icons = { robot: RobotIcon, plant: PlantIcon, energy: LightningIcon, weather: CloudSunIcon };

export default function ProjectArt({
  project,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  const Icon = icons[project.category] || RobotIcon;
  return (
    <div className={`project-art art-${project.category} ${compact ? 'art-compact' : ''}`}>
      {project.image ? (
        <img src={project.image} alt={`Imagen de referencia de ${project.name}`} />
      ) : (
        <>
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <Icon size={compact ? 34 : 76} weight="duotone" aria-hidden="true" />
          {!compact && <span className="art-label">Proyecto de ejemplo</span>}
        </>
      )}
    </div>
  );
}
