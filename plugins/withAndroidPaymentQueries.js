const { withAndroidManifest } = require('@expo/config-plugins');

const SCHEMES = ['upi', 'phonepe', 'paytmmp', 'tez', 'ppe', 'gpay', 'bhim'];

function withAndroidPaymentQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest.queries) {
      manifest.queries = [{}];
    }
    const queries = manifest.queries[0];
    queries.intent = queries.intent || [];
    for (const scheme of SCHEMES) {
      const exists = queries.intent.some(
        (entry) => entry?.data?.[0]?.$?.['android:scheme'] === scheme,
      );
      if (!exists) {
        queries.intent.push({
          action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
          data: [{ $: { 'android:scheme': scheme } }],
        });
      }
    }
    return config;
  });
}

module.exports = withAndroidPaymentQueries;
