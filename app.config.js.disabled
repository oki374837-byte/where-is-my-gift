const baseConfig = require('./app.json');

module.exports = ({ config }) => ({
  ...baseConfig.expo,
  ...config,
  android: {
    ...baseConfig.expo.android,
    ...config?.android,
    package: 'com.keeokis.kee',
    config: {
      ...(baseConfig.expo.android?.config || {}),
      ...(config?.android?.config || {}),
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      },
    },
  },
  extra: {
    ...(baseConfig.expo.extra || {}),
    ...(config?.extra || {}),
  },
});
