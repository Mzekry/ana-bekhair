// Web no-op stub for @react-native-firebase/messaging.
// @react-native-firebase is native-only and cannot bundle for web, so on the
// web platform Metro resolves this file instead (see metro.config.js).
// Push messaging isn't available in a WebView wrapper; methods resolve to safe
// "not authorized / no token" values that match the call sites in the app.
const AuthorizationStatus = {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
};

function messaging() {
  return {
    requestPermission: () => Promise.resolve(AuthorizationStatus.DENIED),
    getToken: () => Promise.resolve(null),
    onMessage: () => () => {},
    onNotificationOpenedApp: () => () => {},
  };
}

messaging.AuthorizationStatus = AuthorizationStatus;

export default messaging;
