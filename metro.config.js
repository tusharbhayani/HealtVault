const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add crypto polyfills for React Native
config.resolver.alias = {
  ...config.resolver.alias,
  stream: 'readable-stream',
};

config.resolver.fallback = {
  ...config.resolver.fallback,
  stream: require.resolve('readable-stream'),
  vm: false,
  fs: false,
  net: false,
  tls: false,
};

module.exports = config;
