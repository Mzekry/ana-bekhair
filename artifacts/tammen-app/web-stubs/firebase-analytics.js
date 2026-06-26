// Web no-op stub for @react-native-firebase/analytics.
// @react-native-firebase is native-only and cannot bundle for web, so on the
// web platform Metro resolves this file instead (see metro.config.js).
// All methods are no-ops that match the call sites in the app.
const instance = {
  logLogin: () => Promise.resolve(),
  logSignUp: () => Promise.resolve(),
  logEvent: () => Promise.resolve(),
  setUserId: () => Promise.resolve(),
};

function analytics() {
  return instance;
}

export default analytics;
