import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "np.com.nirmalsanjel.jbcathenaeum",
  appName: "JBC Athenaeum",
  webDir: "dist",
  server: {
    // Never permit cleartext HTTP in production native builds.
    cleartext: false,
    androidScheme: "https",
    iosScheme: "capacitor",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#F8FAFC",
  },
  ios: {
    backgroundColor: "#F8FAFC",
    contentInset: "automatic",
  },
};

export default config;
