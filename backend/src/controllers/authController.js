const admin = require('../config/firebase');
const prisma = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { sendOtpEmail } = require('../services/emailService');

// Custom Zod validation schemas
const nameSchema = z.string()
  .min(2, 'Name must contain at least 2 characters')
  .max(50, 'Name must be 50 characters or less')
  .trim()
  .refine(val => /^[A-Za-z\s\-]+$/.test(val), {
    message: 'Name can only contain letters, spaces, and hyphens'
  });

const validTlds = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'co', 'io', 'ai', 'info', 'biz', 'me', 'tech', 'app', 'dev', 'ly', 'so', 'fm', 'to', 'tv', 'cc',
  'in', 'us', 'uk', 'ca', 'au', 'sg', 'ae', 'de', 'fr', 'jp', 'cn', 'nz', 'nl', 'se', 'no', 'fi', 'dk', 'ch', 'at', 'it', 'es', 'pt', 'ie', 'hk', 'my', 'tw', 'kr', 'za', 'br', 'ru', 'mx', 'ar', 'cl', 'pe', 'co', 've', 'pk', 'bd', 'lk', 'np', 'sa', 'eg', 'tr', 'gr', 'pl', 'ro', 'ua', 'cz', 'hu', 'be'
]);

const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .trim()
  .toLowerCase()
  .refine(val => {
    const parts = val.split('@');
    if (parts.length !== 2) return false;
    const localPart = parts[0];
    const domainPart = parts[1];
    
    if (localPart.length > 64) return false;
    if (val.includes('..')) return false;
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
    
    // TLD check
    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) return false;
    const tld = domainParts[domainParts.length - 1];
    if (!validTlds.has(tld)) return false;
    
    return true;
  }, { message: 'Invalid email format or unsupported domain suffix (TLD)' });

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*_)(?=.*[!@#$%^&*()\-+=<>?/{}[\]|:;"'`,.~])[A-Za-z\d_!@#$%^&*()\-+=<>?/{}[\]|:;"'`,.~]{6,10}$/;
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(10, 'Password must be 10 characters or less')
  .refine(val => passwordRegex.test(val), {
    message: 'Password must be 6–10 characters and contain at least one uppercase letter, one lowercase letter, one digit, one underscore, and one special character.'
  });

// Validate phone number digits count based on country code
function validatePhone(countryCode, number) {
  const cleanNumber = number.replace(/\s+/g, '').replace(/\-/g, '');
  if (!/^\d+$/.test(cleanNumber)) {
    throw new Error('Phone number must contain digits only');
  }
  
  const digitLimits = {
    '+91': 10,
    '+1': 10,
    '+44': 10,
    '+971': 9,
    '+65': 8
  };
  
  const requiredDigits = digitLimits[countryCode];
  if (!requiredDigits) {
    throw new Error('Unsupported country code');
  }
  
  if (cleanNumber.length !== requiredDigits) {
    throw new Error(`Phone number must contain exactly ${requiredDigits} digits`);
  }
  
  return `${countryCode}${cleanNumber}`;
}

// Validate that a database user has both a valid email and phone number format
function validateStoredEmailAndPhone(user) {
  if (!user.email) {
    throw new Error('Associated email address is missing.');
  }
  try {
    emailSchema.parse(user.email);
  } catch (err) {
    throw new Error('Associated email format is invalid.');
  }

  if (!user.phone) {
    throw new Error('Associated phone number is missing.');
  }
  const prefixes = ['+91', '+1', '+44', '+971', '+65'];
  const matchedPrefix = prefixes.find(p => user.phone.startsWith(p));
  if (!matchedPrefix) {
    throw new Error('Associated phone number has an unsupported country code.');
  }
  const phoneNoPrefix = user.phone.slice(matchedPrefix.length);
  try {
    validatePhone(matchedPrefix, phoneNoPrefix);
  } catch (err) {
    throw new Error('Associated phone number format is invalid.');
  }
}

// 1. Signup user and send mock verification OTP code
async function signUp(req, res, next) {
  try {
    const { name, email, countryCode, phone, password, confirmPassword } = req.body;

    if (!name || !email || !countryCode || !phone || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Run validations
    const validatedName = nameSchema.parse(name);
    const validatedEmail = emailSchema.parse(email);
    const validatedPassword = passwordSchema.parse(password);
    const fullPhone = validatePhone(countryCode, phone);

    const deletedUserIds = new Set();

    // Duplicate check for Email
    const existingEmail = await prisma.user.findUnique({ where: { email: validatedEmail } });
    if (existingEmail) {
      if (existingEmail.verified) {
        return res.status(400).json({ error: 'Email is already registered. Please log in.' });
      } else {
        // Delete dependent records first to avoid foreign key violations
        await prisma.userProgress.deleteMany({ where: { userId: existingEmail.id } });
        await prisma.quizResult.deleteMany({ where: { userId: existingEmail.id } });
        await prisma.user.delete({ where: { id: existingEmail.id } });
        deletedUserIds.add(existingEmail.id);
      }
    }

    // Duplicate check for Phone
    const existingPhone = await prisma.user.findUnique({ where: { phone: fullPhone } });
    if (existingPhone) {
      if (existingPhone.verified) {
        return res.status(400).json({ error: 'Phone number is already registered. Please log in.' });
      } else if (!deletedUserIds.has(existingPhone.id)) {
        // Delete dependent records first to avoid foreign key violations
        await prisma.userProgress.deleteMany({ where: { userId: existingPhone.id } });
        await prisma.quizResult.deleteMany({ where: { userId: existingPhone.id } });
        await prisma.user.delete({ where: { id: existingPhone.id } });
      }
    }

    // Hash password and prepare OTP (expires in 3 minutes)
    const passwordHash = await bcrypt.hash(validatedPassword, 10);
    const isDev = process.env.NODE_ENV === 'development';
    const generatedOtp = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000); 

    await prisma.user.create({
      data: {
        email: validatedEmail,
        name: validatedName,
        phone: fullPhone,
        passwordHash,
        otp: generatedOtp,
        otpExpires,
        otpAttempts: 0,
        otpSentAt: new Date(),
        otpSentCountHour: 1,
        otpLastSentHourAt: new Date()
      }
    });

    const otpChannel = req.body.otpChannel || 'email';
    if (otpChannel === 'phone') {
      console.log(`[AUTH] Signup OTP generated for phone ${fullPhone}: ${generatedOtp}`);
    } else {
      console.log(`[AUTH] Signup OTP generated for email ${validatedEmail}: ${generatedOtp}`);
    }

    // Trigger SMTP email sending
    await sendOtpEmail(validatedEmail, generatedOtp);

    res.status(200).json({
      message: 'Verification code sent.',
      email: validatedEmail,
      otpChannel
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      const errMsg = err.errors && err.errors[0] ? err.errors[0].message : (err.issues && err.issues[0] ? err.issues[0].message : 'Invalid validation input');
      return res.status(400).json({ error: errMsg });
    }
    if (err.message && err.message.includes('digits')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

// 2. Verify Signup OTP
async function verifySignUp(req, res, next) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user || !user.otp) {
      return res.status(400).json({ error: 'Verification session expired. Please sign up again.' });
    }

    if (new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    if (user.otpAttempts >= 3) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otp: null, otpExpires: null }
      });
      return res.status(400).json({ error: 'Maximum verification attempts exceeded. Please resend a new OTP.' });
    }

    if (code !== user.otp) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: { increment: 1 } }
      });
      return res.status(400).json({ error: 'Incorrect OTP.' });
    }

    // Success: activate user by removing OTP block
    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpires: null,
        otpAttempts: 0,
        verified: true
      }
    });

    const accessToken = jwt.sign(
      { userId: verifiedUser.id, email: verifiedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: verifiedUser.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      accessToken,
      refreshToken,
      user: verifiedUser
    });

  } catch (err) {
    next(err);
  }
}

// 3. Login with credentials and generate login OTP
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const validatedEmail = email.trim().toLowerCase();

    // First, validate email format on input
    try {
      emailSchema.parse(validatedEmail);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: validatedEmail }
    });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'Account not found. Please sign up.' });
    }

    // Verify account is verified/activated
    if (!user.verified) {
      return res.status(400).json({ error: 'Account not verified. Please verify your signup OTP first.' });
    }

    // Enforce that both email and phone number are present and valid on the account
    try {
      validateStoredEmailAndPhone(user);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Incorrect password.' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

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

// 4. Verify Login OTP
async function verifyLoginOtp(req, res, next) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!user || !user.otp) {
      return res.status(400).json({ error: 'Login session expired or invalid. Please login again.' });
    }

    if (new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    if (user.otpAttempts >= 3) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otp: null, otpExpires: null }
      });
      return res.status(400).json({ error: 'Maximum verification attempts exceeded. Please login again.' });
    }

    if (code !== user.otp) {
      await prisma.user.update({
        where: { id: user.id },
        data: { otpAttempts: { increment: 1 } }
      });
      return res.status(400).json({ error: 'Incorrect OTP.' });
    }

    // Success! Clear OTP fields
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpires: null,
        otpAttempts: 0
      }
    });

    const accessToken = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: updatedUser.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      accessToken,
      refreshToken,
      user: updatedUser
    });

  } catch (err) {
    next(err);
  }
}

// 5. Resend OTP code with rate limits (max 5/hr, 30s cooldown)
async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const validatedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: validatedEmail }
    });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const now = new Date();
    let sentCount = user.otpSentCountHour;
    let lastSentHourAt = user.otpLastSentHourAt ? new Date(user.otpLastSentHourAt) : null;

    if (lastSentHourAt && (now.getTime() - lastSentHourAt.getTime() < 60 * 60 * 1000)) {
      if (sentCount >= 5) {
        return res.status(429).json({ error: 'Maximum 5 resend requests per hour exceeded.' });
      }
      sentCount += 1;
    } else {
      sentCount = 1;
      lastSentHourAt = now;
    }

    if (user.otpSentAt) {
      const timeSinceLastSent = now.getTime() - new Date(user.otpSentAt).getTime();
      if (timeSinceLastSent < 30 * 1000) {
        return res.status(400).json({ error: 'Please wait 30 seconds before requesting a new code.' });
      }
    }

    const isDev = process.env.NODE_ENV === 'development';
    const generatedOtp = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(now.getTime() + 3 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: generatedOtp,
        otpExpires,
        otpAttempts: 0,
        otpSentAt: now,
        otpSentCountHour: sentCount,
        otpLastSentHourAt: lastSentHourAt
      }
    });

    console.log(`[AUTH] Resent OTP generated for ${validatedEmail}: ${generatedOtp}`);

    // Trigger SMTP email sending
    await sendOtpEmail(validatedEmail, generatedOtp);

    res.status(200).json({ message: 'A new code has been sent.' });

  } catch (err) {
    next(err);
  }
}

// 6. Phone number login (checks unique phone and generates OTP)
async function phoneLogin(req, res, next) {
  try {
    const { countryCode, phone } = req.body;
    if (!countryCode || !phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const fullPhone = validatePhone(countryCode, phone);
    const user = await prisma.user.findUnique({ where: { phone: fullPhone } });
    if (!user) {
      return res.status(400).json({ error: 'Account not found. Please sign up.' });
    }

    // Verify account is verified/activated
    if (!user.verified) {
      return res.status(400).json({ error: 'Account not verified. Please verify your signup OTP first.' });
    }

    // Enforce that both email and phone number are present and valid on the account
    try {
      validateStoredEmailAndPhone(user);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const isDev = process.env.NODE_ENV === 'development';
    const generatedOtp = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: generatedOtp,
        otpExpires,
        otpAttempts: 0,
        otpSentAt: new Date()
      }
    });
    console.log(`[AUTH] Phone Login OTP generated for ${fullPhone}: ${generatedOtp}`);

    // Trigger SMTP email sending
    await sendOtpEmail(user.email, generatedOtp);

    res.status(200).json({
      message: 'Login OTP sent.',
      email: user.email
    });
  } catch (err) {
    if (err.message && err.message.includes('digits')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

// Legacy Firebase login compatibility
async function loginWithFirebase(req, res, next) {
  try {
    const { firebaseToken } = req.body;
    if (!firebaseToken) {
      return res.status(400).json({ error: 'Firebase token required' });
    }

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
    
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: decodedToken.uid },
          { email: decodedToken.email }
        ]
      }
    });

    if (user) {
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
      user = await prisma.user.create({
        data: {
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || null
        }
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

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

async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Refresh token expired, please login again' });
        }
        return next(err);
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });

        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

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
  signUp,
  verifySignUp,
  login,
  verifyLoginOtp,
  phoneLogin,
  resendOtp,
  loginWithFirebase,
  refreshToken
};
