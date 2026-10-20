export type ToolId =
  'camera' | 'scanner' | 'location' | 'accelerometer' | 'gyroscope' | 'biometrics';
export type Vector3 = { x: number; y: number; z: number };
export type RecordPayload =
  | { kind: 'camera'; uri: string; width: number; height: number }
  | { kind: 'scanner'; content: string; format: string }
  | {
      kind: 'location';
      latitude: number;
      longitude: number;
      accuracy: number | null;
      altitude: number | null;
    }
  | { kind: 'accelerometer' | 'gyroscope'; vector: Vector3; unit: 'g' | 'rad/s' }
  | { kind: 'biometrics'; method: string; verifiedAt: string };

export type DeviceRecord = {
  id: string;
  title: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  payload: RecordPayload;
};
export type RecordInput = Pick<DeviceRecord, 'title' | 'notes' | 'payload'>;
export type ThemeMode = 'light' | 'dark';
