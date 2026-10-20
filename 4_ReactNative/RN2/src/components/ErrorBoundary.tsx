import { Component, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

/** Última barrera: mantiene una recuperación visible si falla un módulo nativo. */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; revision: number }
> {
  state = { failed: false, revision: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#F4F5EF',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 28,
            gap: 20,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{ fontSize: 26, color: '#19291F', fontWeight: '600', textAlign: 'center' }}
          >
            No pudimos abrir esta pantalla.
          </Text>
          <Text style={{ fontSize: 16, color: '#5E6B60', textAlign: 'center' }}>
            Tus registros guardados se conservan. Volvé al inicio para reintentar.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              this.setState((state) => ({ failed: false, revision: state.revision + 1 }))
            }
            style={{ backgroundColor: '#285C3D', borderRadius: 12, padding: 16, minHeight: 48 }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Volver al inicio</Text>
          </Pressable>
        </View>
      );
    return (
      <View key={this.state.revision} style={{ flex: 1 }}>
        {this.props.children}
      </View>
    );
  }
}
