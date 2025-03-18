const admin = require("firebase-admin");
const chalk = require('chalk')

const serviceAccount = require("./firebase_adminSDK.json");

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log(chalk.magenta.bold('✅ Firebase Initialized !'))
} catch (error) {
  console.error("Firebase initialization failed:", error.message);
}

const messaging = admin.messaging();

module.exports = { messaging };
