require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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

// Middleware for rate limiting (simple in-memory example)
const rateLimit = {};
const RATE_LIMIT_WINDOW = 300000; // 5 minutes

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
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  // Sanitize and validate phone number
  const sanitizedPhone = phone.replace(/[^+\d]/g, '');
  const otp = generateOtp();

  try {
    // Save OTP to Firestore
    const otpDocRef = db.collection('otps').doc(sanitizedPhone);
    await otpDocRef.set({
      otp,
      createdAt: new Date().toISOString(),
    });

    try {
      // Attempt to send OTP via Eskiz
      const response = await axios.post(
        'https://notify.eskiz.uz/api/message/sms/send',
        {
          mobile_phone: sanitizedPhone,
          message: `Your verification code is ${otp}`,
          from: '4546',
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        }
      );

      if (response.data.status === 'success' || response.data.status === 'waiting') {
        return res.status(200).json({
          message: 'SMS sent successfully',
        });
      } else {
        console.error('Eskiz API Error:', response.data);
      }
    } catch (smsError) {
      console.error('Error sending SMS via Eskiz:', smsError.response?.data || smsError.message);
    }

    // Redirect to verification even if SMS fails
    res.status(200).json({
      message: 'OTP saved successfully, proceed to verification.',
    });
  } catch (error) {
    console.error('Error saving OTP:', error.message);
    res.status(500).json({ message: 'Error saving OTP to Firestore', error: error.message });
  }
});

// Endpoint to verify the OTP
app.post('/verify-code', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ message: 'Phone number and code are required' });
  }

  // Sanitize phone number
  const sanitizedPhone = phone.replace(/[^+\d]/g, '');

  try {
    const otpDocRef = db.collection('otps').doc(sanitizedPhone);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({ message: 'OTP not found' });
    }

    const { otp } = otpDoc.data();
    if (code === otp) {
      // Check if the user already exists
      const userDocRef = db.collection('users').doc(sanitizedPhone);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        // Create new user if not exists
        await userDocRef.set({
          phone: sanitizedPhone,
          createdAt: new Date().toISOString(),
          name: '',
        });
      }

      res.status(200).json({ message: 'Verification successful', loggedIn: true });
    } else {
      res.status(400).json({ message: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('Error verifying code:', error.message);
    res.status(500).json({
      message: 'Error occurred during verification',
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

// const app = express();
// app.use(express.json());

// // Eskiz API configuration
// const ESKIZ_EMAIL = process.env.ESKIZ_EMAIL;
// const ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD;
// const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// // Endpoint to send SMS
// app.post('/send-sms', async (req, res) => {
//     const { phone } = req.body;

//     if (!phone) {
//         return res.status(400).json({ message: 'Phone number is required' });
//     }

//     try {
//         const response = await axios.post(
//             'https://notify.eskiz.uz/api/message/sms/send',
//             {
//                 mobile_phone: phone,
//                 message: 'This is test from Eskiz', // Replace with dynamic code if needed
//                 from: '4546',
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${ACCESS_TOKEN}`,
//                 },
//             }
//         );

//         // Treat "waiting" as a successful response
//         if (response.data.status === 'success' || response.data.status === 'waiting') {
//             res.status(200).json({
//                 message: 'SMS sent successfully',
//                 details: response.data,
//             });
//         } else {
//             res.status(400).json({
//                 message: 'Failed to send SMS',
//                 details: response.data,
//             });
//         }
//     } catch (error) {
//         console.error('Error sending SMS:', error.response?.data || error.message);
//         res.status(500).json({
//             message: 'Error occurred while sending SMS',
//             error: error.response?.data || error.message,
//         });
//     }
// });

// // Endpoint to verify the code
// app.post('/verify-code', async (req, res) => {
//   const { phone, code } = req.body;

//   if (!phone || !code) {
//     return res.status(400).json({ message: 'Phone number and code are required' });
//   }

//   try {
//     // Simulate verification (replace with actual logic if needed)
//     const correctCode = 'This is test from Eskiz'; // Replace with dynamically generated code
//     if (code === correctCode) {
//       res.status(200).json({ message: 'Verification successful' });
//     } else {
//       res.status(400).json({ message: 'Invalid verification code' });
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







// require('dotenv').config();
// const express = require('express');
// const axios = require('axios');

// const app = express();
// app.use(express.json());

// // Eskiz API configuration
// const ESKIZ_EMAIL = process.env.ESKIZ_EMAIL;
// const ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD;
// const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// // Endpoint to send SMS
// app.post('/send-sms', async (req, res) => {
//     const { phone } = req.body;

//     if (!phone) {
//         return res.status(400).json({ message: 'Phone number is required' });
//     }

//     try {
//         const response = await axios.post(
//             'https://notify.eskiz.uz/api/message/sms/send',
//             {
//                 mobile_phone: phone,
//                 message: 'This is test from Eskiz',
//                 from: '4546',
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${ACCESS_TOKEN}`,
//                 },
//             }
//         );

//         if (response.data.status === "success") {
//             res.status(200).json({ message: 'SMS sent successfully' });
//         } else {
//             res.status(500).json({ message: 'Failed to send SMS', details: response.data });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error sending SMS', error: error.message });
//     }
// });

// // Start server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });