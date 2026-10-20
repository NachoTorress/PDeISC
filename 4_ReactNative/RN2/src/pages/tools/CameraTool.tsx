import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
  type CameraType,
} from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { useForeground } from '../../hooks/useForeground';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/Button';
import { Type } from '../../components/Typography';
import { Feedback } from '../../components/Feedback';
import { PermissionGate } from '../../components/PermissionGate';
import { RecordComposer } from '../../components/RecordComposer';
import { isPayload } from '../../utils/validation';
import type { RecordPayload } from '../../types';

export function CameraTool({ scanner = false }: { scanner?: boolean }) {
  const { colors } = useTheme();
  const [permission, requestPermission, refreshPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const scanLock = useRef(false);
  const captureLock = useRef(false);
  const mounted = useRef(true);
  const [facing, setFacing] = useState<CameraType>('back');
  const [torch, setTorch] = useState(false);
  const [ready, setReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RecordPayload | null>(null);
  const [version, setVersion] = useState(0);
  const pauseCamera = useCallback(() => {
    setReady(false);
    setTorch(false);
  }, []);
  const foreground = useForeground(pauseCamera);

  useEffect(() => {
    if (foreground) {
      void refreshPermission().catch(() => setError('No se pudo comprobar el permiso de cámara.'));
    }
  }, [foreground, refreshPermission]);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  function restart() {
    setResult(null);
    setError('');
    setReady(false);
    scanLock.current = false;
    setVersion((previous) => previous + 1);
  }

  function scanned({ data, type }: BarcodeScanningResult) {
    if (scanLock.current || !data) return;
    scanLock.current = true;
    const payload: RecordPayload = { kind: 'scanner', content: data, format: type };
    if (!isPayload(payload)) {
      setError('El código está vacío o supera los 4096 caracteres. Probá con otro código.');
      return;
    }
    setTorch(false);
    setResult(payload);
  }

  async function capture() {
    if (!camera.current || !ready || captureLock.current) return;
    captureLock.current = true;
    setTaking(true);
    setError('');
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.65 });
      if (!mounted.current) return;
      if (!picture?.uri) throw new Error('Sin imagen');
      const payload: RecordPayload = {
        kind: 'camera',
        uri: picture.uri,
        width: picture.width,
        height: picture.height,
      };
      if (!isPayload(payload)) throw new Error('Imagen inválida');
      setTorch(false);
      setResult(payload);
    } catch {
      if (mounted.current)
        setError('No se pudo tomar la foto. Revisá la cámara y volvé a intentar.');
    } finally {
      captureLock.current = false;
      if (mounted.current) setTaking(false);
    }
  }

  if (!permission)
    return (
      <ActivityIndicator
        color={colors.accent}
        accessibilityLabel="Comprobando permisos de cámara"
      />
    );
  if (!permission.granted)
    return (
      <PermissionGate
        icon={scanner ? 'scanner' : 'camera'}
        title="La cámara necesita tu permiso"
        description={
          scanner
            ? 'Usamos la cámara para leer el código que enfoques. El contenido se queda en tu dispositivo.'
            : 'Usamos la cámara para tomar fotos. Solo se conservan las que decidas guardar.'
        }
        canAskAgain={permission.canAskAgain}
        request={requestPermission}
      />
    );
  return (
    <View style={{ gap: 22 }}>
      {result ? (
        <View style={{ gap: 12 }}>
          {result.kind === 'camera' && (
            <Image
              source={{ uri: result.uri }}
              accessibilityLabel="Foto capturada"
              style={{
                width: '100%',
                height: 360,
                borderRadius: 16,
                backgroundColor: colors.raised,
              }}
              resizeMode="contain"
            />
          )}
          {result.kind === 'scanner' && (
            <View
              style={{ padding: 24, borderRadius: 16, backgroundColor: colors.raised, gap: 12 }}
            >
              <Type size={14} tone="muted">
                Código detectado · {result.format.toUpperCase()}
              </Type>
              <Type selectable size={20} weight="medium">
                {result.content}
              </Type>
              <Type size={13} tone="muted">
                Los enlaces leídos no se abren automáticamente.
              </Type>
            </View>
          )}
          <Button
            label={scanner ? 'Leer otro código' : 'Tomar otra foto'}
            variant="secondary"
            icon="rotate"
            onPress={restart}
          />
        </View>
      ) : (
        <>
          <View
            nativeID="pulso-camera-preview"
            style={{
              height: 360,
              backgroundColor: '#101A14',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {foreground ? (
              <CameraView
                key={`${version}-${facing}`}
                ref={camera}
                style={{ flex: 1 }}
                facing={facing}
                enableTorch={torch && facing === 'back'}
                onCameraReady={() => {
                  setReady(true);
                  setError('');
                }}
                onMountError={() => {
                  setReady(false);
                  setError(
                    'La cámara no pudo iniciarse. Cerrá otras aplicaciones que la usen y reintentá.',
                  );
                }}
                barcodeScannerSettings={
                  scanner
                    ? {
                        barcodeTypes: [
                          'qr',
                          'ean13',
                          'ean8',
                          'code128',
                          'code39',
                          'upc_a',
                          'upc_e',
                          'pdf417',
                          'aztec',
                          'datamatrix',
                        ],
                      }
                    : undefined
                }
                onBarcodeScanned={scanner ? scanned : undefined}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Type style={{ color: '#FFFFFF' }}>La cámara está pausada.</Type>
              </View>
            )}
            {scanner && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  inset: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 220,
                    height: 200,
                    borderWidth: 2,
                    borderColor: colors.lime,
                    borderRadius: 20,
                  }}
                />
              </View>
            )}
          </View>
          <Type size={14} tone="muted">
            {scanner
              ? 'Ubicá el código dentro del recuadro y mantené el dispositivo estable.'
              : 'La foto se conserva de forma permanente al guardar el registro.'}
          </Type>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {!scanner && (
              <Button
                label="Tomar foto"
                icon="camera"
                disabled={!ready || !foreground}
                busy={taking}
                onPress={() => {
                  void capture();
                }}
              />
            )}
            {!scanner && (
              <Button
                label={facing === 'back' ? 'Usar cámara frontal' : 'Usar cámara trasera'}
                icon="rotate"
                variant="secondary"
                disabled={taking}
                onPress={() => {
                  setReady(false);
                  setTorch(false);
                  setFacing((previous) => (previous === 'back' ? 'front' : 'back'));
                }}
              />
            )}
            {facing === 'back' && (
              <Button
                label={torch ? 'Apagar linterna' : 'Encender linterna'}
                icon="sun"
                variant="secondary"
                disabled={!ready || taking}
                onPress={() => setTorch((previous) => !previous)}
              />
            )}
            {!!error && (
              <Button label="Reiniciar cámara" icon="rotate" variant="ghost" onPress={restart} />
            )}
          </View>
        </>
      )}
      <Feedback message={error} />
      {result && (
        <RecordComposer
          key={version}
          payload={result}
          title={scanner ? 'Código escaneado' : 'Mi captura'}
        />
      )}
    </View>
  );
}
