const admin = require('../config/firebase');
const prisma = require('../config/database');
const jwt = require('jsonwebtoken');

// 1. Login with Firebase Token
async function loginWithFirebase(req, res, next) {
  try {
    const { firebaseToken } = req.body;
    if (!firebaseToken) {
      return res.status(400).json({ error: 'Firebase token required' });
    }

    // Verify token with Firebase (bypass in development for mock tokens)
    let decodedToken;
    if (process.env.NODE_ENV === 'development' && firebaseToken.startsWith('mock-token-')) {
      const email = firebaseToken.replace('mock-token-', '');
      decodedToken = {
        uid: `mock-uid-${email}`,
        email: email,
        name: email.split('@')[0]
      };
    } else {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    }
    
    // Find user by firebaseUid or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: decodedToken.uid },
          { email: decodedToken.email }
        ]
      }
    });

    if (user) {
      // If found but firebaseUid is missing or different, update it
      if (user.firebaseUid !== decodedToken.uid) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            firebaseUid: decodedToken.uid,
            name: decodedToken.name || user.name || null
          }
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || null
        }
      });
    }

    // Sign JWT Access Token (15 mins)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Sign JWT Refresh Token (7 days)
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      accessToken,
      refreshToken,
      user
    });
  } catch (err) {
    next(err);
  }
}

// 2. Refresh Access Token
async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Refresh token expired, please login again' });
        }
        return next(err);
      }

      try {
        // Fetch user from DB to sign access token with up-to-date email
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });

        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        // Issue new access token (15 mins)
        const accessToken = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );

        return res.status(200).json({ accessToken });
      } catch (dbErr) {
        return next(dbErr);
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  loginWithFirebase,
  refreshToken
};
