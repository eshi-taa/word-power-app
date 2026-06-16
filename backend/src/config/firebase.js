const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.warn('WARNING: firebase-service-account.json not found. Running Firebase Admin in local/mock mode.');
  // Initialize with local credentials placeholder to prevent startup crashes
  admin.initializeApp({
    projectId: 'word-power-mock-project'
  });
}

module.exports = admin;
