const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Monorepo setup: this app lives at artifacts/tammen-app, and the workspace
// root (with the hoisted node_modules) is two levels up. Metro must watch the
// workspace root and resolve modules from both node_modules folders.
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.blockList = [
  /.*phoenix_tmp.*/,
];

// @react-native-firebase is native-only and breaks the web bundle. On the web
// platform, redirect those imports to local no-op stubs so the static web
// export (for the Capacitor WebView build) succeeds.
const webStubs = {
  "@react-native-firebase/analytics": path.resolve(
    projectRoot,
    "web-stubs/firebase-analytics.js"
  ),
  "@react-native-firebase/messaging": path.resolve(
    projectRoot,
    "web-stubs/firebase-messaging.js"
  ),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && webStubs[moduleName]) {
    return { type: "sourceFile", filePath: webStubs[moduleName] };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
