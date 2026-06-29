const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount = null;

const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (serviceAccountEnv) {
  try {
    const rawJson = serviceAccountEnv.trim();
    if (rawJson.startsWith('{')) {
      serviceAccount = JSON.parse(rawJson);
    } else {
      const decoded = Buffer.from(rawJson, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    }
  } catch (err) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT env var:', err);
  }
}

const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else if (fs.existsSync(serviceAccountPath)) {
  const accountData = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(accountData)
  });
} else {
  console.warn('WARNING: Firebase credentials not found (env or file). Running Firebase Admin in local/mock/dev mode.');
  admin.initializeApp({
    projectId: 'word-power-mock-project'
  });
}

module.exports = admin;
