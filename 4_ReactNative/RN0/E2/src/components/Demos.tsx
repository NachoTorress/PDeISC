import React, { useState, ReactNode } from 'react';
import {
  View, Text, Image, ImageBackground, TextInput, Button, Pressable, TouchableOpacity, Switch,
  ActivityIndicator, ScrollView, FlatList, SectionList, Modal, KeyboardAvoidingView,
  RefreshControl, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

const LOGO = { uri: 'https://reactnative.dev/img/tiny_logo.png' };
/** Solo letras (con tildes), espacios y apóstrofes. */
const NAME_REGEX = /^[A-Za-zÀ-ÿ' ]*$/;

/** Texto que respeta el tema. */
function T({ children, style }: { children: ReactNode; style?: object }) {
  const { colors } = useTheme();
  return <Text style={[{ color: colors.text }, style]}>{children}</Text>;
}

/** TextInput con validación en tiempo real (rojo + mensaje). Label aparte, sin placeholder. */
function InputDemo() {
  const { colors } = useTheme();
  const [v, setV] = useState('');
  const error = NAME_REGEX.test(v) ? '' : 'Solo se permiten letras y apóstrofes.';
  return (
    <View>
      <T style={{ marginBottom: 4 }}>Nombre</T>
      <TextInput
        value={v}
        onChangeText={setV}
        style={[styles.input, { color: colors.text, borderColor: error ? colors.danger : colors.border }]}
      />
      {!!error && <Text style={{ color: colors.danger, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}

/** Pressable / TouchableOpacity con contador. */
function CounterDemo({ touchable }: { touchable?: boolean }) {
  const { colors } = useTheme();
  const [n, setN] = useState(0);
  const Comp: any = touchable ? TouchableOpacity : Pressable;
  return (
    <Comp onPress={() => setN(n + 1)} style={[styles.btn, { backgroundColor: colors.primary }]}>
      <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>Presionado {n} veces</Text>
    </Comp>
  );
}

/** Switch con etiqueta de estado. */
function SwitchDemo() {
  const [on, setOn] = useState(false);
  return (
    <View style={styles.row}>
      <Switch value={on} onValueChange={setOn} />
      <T>{on ? 'Encendido' : 'Apagado'}</T>
    </View>
  );
}

/** Modal con botón de cierre. */
function ModalDemo() {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Button title="Abrir Modal" onPress={() => setOpen(true)} color={colors.primary} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <T style={{ marginBottom: 12 }}>Soy un Modal sobre la pantalla</T>
            <Button title="Cerrar" onPress={() => setOpen(false)} color={colors.primary} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/** RefreshControl: simula una recarga de 1,5 s. */
function RefreshDemo() {
  const [r, setR] = useState(false);
  const run = () => { setR(true); setTimeout(() => setR(false), 1500); };
  return (
    <ScrollView style={{ height: 90 }} nestedScrollEnabled refreshControl={<RefreshControl refreshing={r} onRefresh={run} />}>
      <T>Tirá hacia abajo para refrescar</T>
    </ScrollView>
  );
}

/** Aviso para componentes sin representación visual propia. */
const Invisible = ({ text }: { text: string }) => <T style={{ fontStyle: 'italic' }}>{text}</T>;

/** Mapa nombre de componente → demo. Origen: HomeScreen. */
export const DEMOS: Record<string, () => React.ReactElement> = {
  View: () => <View style={styles.box} />,
  Text: () => <T style={{ fontWeight: '800', fontSize: 18 }}>Texto en negrita</T>,
  Image: () => <Image source={LOGO} style={{ width: 60, height: 60 }} />,
  ImageBackground: () => (
    <ImageBackground source={LOGO} style={styles.bg} resizeMode="contain">
      <Text style={{ color: '#fff', fontWeight: '800' }}>Encima</Text>
    </ImageBackground>
  ),
  TextInput: () => <InputDemo />,
  Button: () => <Button title="Botón nativo" onPress={() => {}} />,
  Pressable: () => <CounterDemo />,
  TouchableOpacity: () => <CounterDemo touchable />,
  Switch: () => <SwitchDemo />,
  ActivityIndicator: () => <ActivityIndicator size="large" />,
  ScrollView: () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {[1, 2, 3, 4, 5, 6].map((i) => <View key={i} style={[styles.box, { margin: 4 }]}><Text style={{ color: '#fff' }}>{i}</Text></View>)}
    </ScrollView>
  ),
  FlatList: () => (
    <FlatList scrollEnabled={false} data={['Uno', 'Dos', 'Tres']} keyExtractor={(x) => x} renderItem={({ item }) => <T>• {item}</T>} />
  ),
  SectionList: () => (
    <SectionList
      scrollEnabled={false}
      sections={[{ title: 'Frutas', data: ['Manzana', 'Pera'] }, { title: 'Verduras', data: ['Zanahoria'] }]}
      keyExtractor={(x) => x}
      renderSectionHeader={({ section }) => <T style={{ fontWeight: '800', marginTop: 4 }}>{section.title}</T>}
      renderItem={({ item }) => <T>   {item}</T>}
    />
  ),
  Modal: () => <ModalDemo />,
  KeyboardAvoidingView: () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Invisible text="Envuelve formularios: al abrir el teclado, sube el contenido." />
    </KeyboardAvoidingView>
  ),
  StatusBar: () => <Invisible text="Sin representación visual: cambia la barra de estado (barStyle, hidden)." />,
  RefreshControl: () => <RefreshDemo />,
  'SafeAreaView (safe-area-context)': () => (
    <SafeAreaView edges={[]}><T>Contenido dentro del área segura</T></SafeAreaView>
  ),
};

const styles = StyleSheet.create({
  input: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  btn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center' },
  bg: { height: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: '#444', borderRadius: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { padding: 20, borderRadius: 16, width: '100%', maxWidth: 420 },
});
