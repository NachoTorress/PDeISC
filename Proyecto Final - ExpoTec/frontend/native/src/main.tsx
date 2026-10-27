/** Punto de entrada de Expo: recupera un acceso social pendiente antes de mostrar la app. */
import { registerRootComponent } from "expo";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import App from "./app";
import { socialBridge } from "./lib/socialBridge";

/** Espera a que el puente social restaure su estado en Android y luego monta la app. */
function Root() {
  const [ready, setReady] = useState(Platform.OS === "web");
  useEffect(() => {
    void socialBridge.restore().finally(() => setReady(true));
  }, []);
  return ready ? <App /> : null;
}
registerRootComponent(Root);
