import { registerRootComponent } from "expo";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import App from "./app";
import { socialBridge } from "./lib/socialBridge";

function Root() {
  const [ready, setReady] = useState(Platform.OS === "web");
  useEffect(() => {
    void socialBridge.restore().finally(() => setReady(true));
  }, []);
  return ready ? <App /> : null;
}
registerRootComponent(Root);
