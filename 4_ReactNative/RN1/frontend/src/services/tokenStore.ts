import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const key = 'acceso-session';

// Web mantiene la sesión en la pestaña; Android/iOS usan el almacén seguro del sistema.
export const tokenStore = {
  get: () => Platform.OS === 'web' ? Promise.resolve(sessionStorage.getItem(key)) : SecureStore.getItemAsync(key),
  set: (token: string) => Platform.OS === 'web' ? Promise.resolve(sessionStorage.setItem(key, token)) : SecureStore.setItemAsync(key, token),
  remove: () => Platform.OS === 'web' ? Promise.resolve(sessionStorage.removeItem(key)) : SecureStore.deleteItemAsync(key)
};
