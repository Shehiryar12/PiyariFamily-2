const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Watchman is not installed on this Windows machine. Skip the capability
    // probe so Metro uses Node's recursive watcher instead of hanging.
    useWatchman: process.platform !== 'win32',
    blockList: [
      /(^|[/\\])android[/\\]build[/\\].*/,
      /(^|[/\\])android[/\\]app[/\\]build[/\\].*/,
      /(^|[/\\])android[/\\]app[/\\]\.cxx[/\\].*/,
      /(^|[/\\])android[/\\]\.gradle[/\\].*/,
      /(^|[/\\])ios[/\\]Pods[/\\].*/,
      /(^|[/\\])ios[/\\]build[/\\].*/,
      /(^|[/\\])\.git[/\\].*/,
      /(^|[/\\])__tests__[/\\].*/,
    ],
  },
  watcher: {
    healthCheck: {
      enabled: false,
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
