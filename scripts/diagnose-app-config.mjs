const configModule = await import("../app.config.ts");
const config = configModule.default;
const apiKey = config.android?.config?.googleMaps?.apiKey;
console.log(JSON.stringify({
  androidPackage: config.android?.package,
  hasGoogleMapsKey: Boolean(apiKey),
  keyLength: apiKey?.length ?? 0,
}));
