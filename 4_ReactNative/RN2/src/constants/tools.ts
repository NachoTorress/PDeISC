import type { ToolId } from '../types';

export const TOOLS: {
  id: ToolId;
  title: string;
  description: string;
  detail: string;
  color: string;
}[] = [
  {
    id: 'camera',
    title: 'Cámara',
    description: 'Una nueva perspectiva.',
    detail: 'Capturá una foto con la cámara frontal o trasera y guardala en tu dispositivo.',
    color: 'green',
  },
  {
    id: 'scanner',
    title: 'Lector de códigos',
    description: 'De un código a una respuesta.',
    detail:
      'Enfocá un QR o un código de barras. La lectura se detiene al detectar el primer resultado.',
    color: 'blue',
  },
  {
    id: 'location',
    title: 'Ubicación y GPS',
    description: 'Encontrá tu punto de partida.',
    detail:
      'Consultá tus coordenadas y la precisión de la señal. El seguimiento funciona solo mientras esta pantalla está abierta.',
    color: 'orange',
  },
  {
    id: 'accelerometer',
    title: 'Acelerómetro',
    description: 'El movimiento, en números.',
    detail:
      'Mové suavemente el dispositivo para observar la aceleración en tres ejes. La lectura incluye la gravedad.',
    color: 'violet',
  },
  {
    id: 'gyroscope',
    title: 'Giroscopio',
    description: 'Cada giro cuenta.',
    detail: 'Girá el dispositivo para medir su velocidad angular en los ejes X, Y y Z.',
    color: 'teal',
  },
  {
    id: 'biometrics',
    title: 'Biometría',
    description: 'Tu identidad. Tu dispositivo.',
    detail:
      'Probá la huella o el reconocimiento facial configurado en tu teléfono. Pulso nunca accede a tus datos biométricos.',
    color: 'rose',
  },
];

export function toolById(id: ToolId) {
  return TOOLS.find((tool) => tool.id === id)!;
}
