require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin
initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore();

const app = express();
app.use(express.json());

// Eskiz API configuration
const ESKIZ_EMAIL = process.env.ESKIZ_EMAIL;
const ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Helper to generate a random OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Middleware for rate limiting
const rateLimit = {};
const RATE_LIMIT_WINDOW = 30000; // 5 minutes

app.use((req, res, next) => {
  const { phone } = req.body;
  if (req.path === '/send-sms' && phone) {
    const currentTime = Date.now();
    if (rateLimit[phone] && currentTime - rateLimit[phone] < RATE_LIMIT_WINDOW) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }
    rateLimit[phone] = currentTime;
  }
  next();
});

// Endpoint to send SMS
app.post('/send-sms', async (req, res) => {
  const { phone, countryCode } = req.body;

  if (!phone || !countryCode) {
    return res.status(400).json({ message: 'Phone number and country code are required' });
  }

  const sanitizedPhone = phone.replace(/\D/g, '');
  const fullPhone = `${countryCode}${sanitizedPhone}`;

  try {
    // Check if the phone number already exists in the users collection
    const userSnapshot = await db.collection('users').where('phone', '==', phone).get();
    if (!userSnapshot.empty) {
      return res.status(400).json({
        message: 'This phone number is already registered. Please log in or use a different number.',
      });
    }

    const otp = generateOtp();

    // Save OTP to Firestore
    const otpDocRef = db.collection('otps').doc(phone);
    await otpDocRef.set({
      otp,
      createdAt: new Date().toISOString(),
    });

    try {
      // Send OTP using Eskiz
      const response = await axios.post(
        'https://notify.eskiz.uz/api/message/sms/send',
        {
          email: ESKIZ_EMAIL,
          password: ESKIZ_PASSWORD,
          mobile_phone: sanitizedPhone, // Without the `+`
          message: `Your verification code is ${otp}`,
          countryCode: "+998",
          from: '4546',
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        }
      );

      if (response.data.status === 'success' || response.data.status === 'waiting') {
        return res.status(200).json({ message: 'SMS sent successfully' });
      } else {
        console.error('Eskiz API Error:', response.data);
        return res.status(200).json({ message: 'Error sending SMS via Eskiz but SMS has been saved' });
      }
    } catch (smsError) {
      console.error('Error sending SMS via Eskiz:', smsError.response?.data || smsError.message);
      return res.status(200).json({ message: 'Error sending SMS but has also been saved', error: smsError.message });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: 'Error saving OTP or checking user status', error: error.message });
  }
});

// Endpoint to verify the OTP and save user data
app.post('/verify-code', async (req, res) => {
  const { phone, code, name, password, countryCode } = req.body;

  if (!phone || !code || !name || !password || !countryCode) {
    return res.status(400).json({
      message: 'Phone, code, name, password, and country code are required',
    });
  }

  const sanitizedPhone = phone.replace(/\D/g, '');
  const fullPhone = `${"+"}${sanitizedPhone}`;

  try {
    const otpDocRef = db.collection('otps').doc(phone);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({ message: 'OTP not found' });
    }

    const { otp } = otpDoc.data();
    if (code === otp) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      await db.collection('users').doc(userId).set({
        phone: phone,
        name: name,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      });

      return res.status(200).json({
        message: 'User registered successfully',
        userId,
      });
    } else {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('Error verifying code:', error.message);
    res.status(500).json({
      message: 'Error occurred during verification',
      error: error.message,
    });
  }
});

app.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone number and password are required' });
  }

  // Sanitize phone number
  const sanitizedPhone = phone.replace(/[^+\d]/g, '');

  try {
    // Get user data from Firestore
    const userDocRef = db.collection('users').doc(sanitizedPhone);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: storedPassword } = userDoc.data();

    if (await bcrypt.compare(password, storedPassword)) {
      res.status(200).json({ message: 'Login successful', loggedIn: true });
    } else {
      res.status(400).json({ message: 'Incorrect password' });
    }
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({
      message: 'Error occurred during login',
      error: error.message,
    });
  }
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



// require('dotenv').config();
// const express = require('express');
// const axios = require('axios');
// const { initializeApp, applicationDefault } = require('firebase-admin/app');
// const { getFirestore } = require('firebase-admin/firestore');
// const { v4: uuidv4 } = require('uuid');
// const bcrypt = require('bcrypt');

// // Initialize Firebase Admin
// initializeApp({
//   credential: applicationDefault(),
// });
// const db = getFirestore();

// const app = express();
// app.use(express.json());

// // Eskiz API configuration
// const ESKIZ_EMAIL = process.env.ESKIZ_EMAIL;
// const ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD;
// const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// // Helper to generate a random OTP
// const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// // Middleware for rate limiting (simple in-memory example)
// const rateLimit = {};
// const RATE_LIMIT_WINDOW = 300000; // 5 minutes

// app.use((req, res, next) => {
//   const { phone } = req.body;
//   if (req.path === '/send-sms' && phone) {
//     const currentTime = Date.now();
//     if (rateLimit[phone] && currentTime - rateLimit[phone] < RATE_LIMIT_WINDOW) {
//       return res.status(429).json({ message: 'Too many requests. Please try again later.' });
//     }
//     rateLimit[phone] = currentTime;
//   }
//   next();
// });

// // Endpoint to send SMS
// app.post('/send-sms', async (req, res) => {
//   const { phone } = req.body;

//   if (!phone) {
//     return res.status(400).json({ message: 'Phone number is required' });
//   }

//   const sanitizedPhone = phone.replace(/[^+\d]/g, '');
//   const otp = generateOtp();

//   try {
//     const otpDocRef = db.collection('otps').doc(sanitizedPhone);
//     await otpDocRef.set({
//       otp,
//       createdAt: new Date().toISOString(),
//     });

//     try {
//       const response = await axios.post(
//         'https://notify.eskiz.uz/api/message/sms/send',
//         {
//           mobile_phone: sanitizedPhone,
//           message: `Your verification code is ${otp}`,
//           from: '4546',
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${ACCESS_TOKEN}`,
//           },
//         }
//       );

//       if (response.data.status === 'success' || response.data.status === 'waiting') {
//         return res.status(200).json({
//           message: 'SMS sent successfully',
//         });
//       } else {
//         console.error('Eskiz API Error:', response.data);
//       }
//     } catch (smsError) {
//       console.error('Error sending SMS via Eskiz:', smsError.response?.data || smsError.message);
//     }

//     res.status(200).json({
//       message: 'OTP saved successfully. SMS delivery may have failed.',
//     });
//   } catch (error) {
//     console.error('Error saving OTP:', error.message);
//     res.status(500).json({ message: 'Error saving OTP to Firestore', error: error.message });
//   }
// });

// // Endpoint to verify the OTP and save user data
// app.post('/verify-code', async (req, res) => {
//   const { phone, code, name, password } = req.body;

//   if (!phone || !code || !name || !password) {
//     return res.status(400).json({ message: 'Phone, code, name, and password are required' });
//   }

//   const sanitizedPhone = phone.replace(/[^+\d]/g, '');

//   try {
//     const otpDocRef = db.collection('otps').doc(sanitizedPhone);
//     const otpDoc = await otpDocRef.get();

//     if (!otpDoc.exists) {
//       return res.status(400).json({ message: 'OTP not found' });
//     }

//     const { otp } = otpDoc.data();
//     if (code === otp) {
//       const hashedPassword = await bcrypt.hash(password, 10);
//       const userId = uuidv4();

//       await db.collection('users').doc(userId).set({
//         phone: sanitizedPhone,
//         name,
//         password: hashedPassword,
//         createdAt: new Date().toISOString(),
//       });

//       return res.status(200).json({
//         message: 'User registered successfully',
//         userId,
//       });
//     } else {
//       return res.status(400).json({ message: 'Invalid verification code' });
//     }
//   } catch (error) {
//     console.error('Error verifying code:', error.message);
//     res.status(500).json({
//       message: 'Error occurred during verification',
//       error: error.message,
//     });
//   }
// });

// // Start server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });


