/** Catálogo de componentes nativos (nombre y uso). Origen de datos de HomeScreen. */
export type CatalogItem = { name: string; use: string };

export const CATALOG: CatalogItem[] = [
  { name: 'View', use: 'Contenedor básico de layout (como un div). Agrupa y posiciona otros componentes.' },
  { name: 'Text', use: 'Muestra texto. Todo texto debe estar dentro de un Text.' },
  { name: 'Image', use: 'Muestra imágenes locales o remotas.' },
  { name: 'ImageBackground', use: 'Imagen de fondo que permite poner contenido encima.' },
  { name: 'TextInput', use: 'Campo para que el usuario escriba texto.' },
  { name: 'Button', use: 'Botón nativo simple con estilo de plataforma.' },
  { name: 'Pressable', use: 'Área presionable configurable (presión, soltar, presión larga).' },
  { name: 'TouchableOpacity', use: 'Área presionable que baja su opacidad al tocarla.' },
  { name: 'Switch', use: 'Interruptor de encendido/apagado.' },
  { name: 'ActivityIndicator', use: 'Indicador de carga circular.' },
  { name: 'ScrollView', use: 'Contenedor con desplazamiento para pocos elementos.' },
  { name: 'FlatList', use: 'Lista eficiente y virtualizada para muchos elementos.' },
  { name: 'SectionList', use: 'Lista agrupada por secciones con encabezados.' },
  { name: 'Modal', use: 'Ventana emergente sobre la pantalla.' },
  { name: 'KeyboardAvoidingView', use: 'Mueve el contenido para que el teclado no tape los campos.' },
  { name: 'StatusBar', use: 'Controla la barra de estado del sistema (estilo, visibilidad).' },
  { name: 'RefreshControl', use: 'Permite "tirar para refrescar" dentro de un ScrollView o lista.' },
  { name: 'SafeAreaView (safe-area-context)', use: 'Evita que el contenido quede bajo notch o barras del sistema. En RN 0.86 se usa la versión de react-native-safe-area-context.' },
];
