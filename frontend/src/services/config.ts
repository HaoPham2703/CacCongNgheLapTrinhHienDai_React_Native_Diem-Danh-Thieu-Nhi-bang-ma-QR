import Constants from "expo-constants";
import { Platform } from "react-native";

const androidLocalhost = "http://10.0.2.2:5000/api/v1";
const defaultLocalhost = "http://localhost:5000/api/v1";

function getExpoHostUrl() {
  const hostUri =
    Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || Constants.manifest2?.extra?.expoClient?.hostUri;

  if (!hostUri) {
    return null;
  }

  const host = hostUri.split(":")[0];

  if (!host) {
    return null;
  }

  return `http://${host}:5000/api/v1`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === "android" ? androidLocalhost : getExpoHostUrl() || defaultLocalhost);
