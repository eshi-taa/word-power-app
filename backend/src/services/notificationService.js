const admin = require('../config/firebase');
const schedule = require('node-schedule');
const prisma = require('../config/database');

/**
 * Schedules a review notification to be sent to the user via FCM 24 hours from now.
 * 
 * @param {string} userId - The database user ID
 * @param {string} groupId - The database ID of the word group studied
 * @param {string} groupRoot - The root text of the word group (e.g. "CRED")
 */
async function scheduleReviewNotification(userId, groupId, groupRoot) {
  try {
    // 1. Fetch user to select only their fcmToken
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }
    });

    // 2. If user has no fcmToken, return immediately
    if (!user || !user.fcmToken) {
      return;
    }

    // 3. Create Date object for 24 hours from now
    const reviewTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 4. Schedule the job
    schedule.scheduleJob(reviewTime, async () => {
      try {
        const message = {
          token: user.fcmToken,
          notification: {
            title: "Time to review! 🧠",
            body: `Don't break your streak — review your ${groupRoot} words now`
          },
          data: {
            groupId: groupId
          }
        };

        await admin.messaging().send(message);
      } catch (fcmError) {
        // 5. Wraps the messaging call in try/catch to ensure it never crashes the app
        console.error('Error sending FCM review notification:', fcmError);
      }
    });
  } catch (err) {
    console.error('Error scheduling review notification:', err);
  }
}

module.exports = {
  scheduleReviewNotification
};
