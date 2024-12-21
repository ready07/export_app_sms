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
        return res.status(200).json({ message: 'Error sending SMS via Eskiz but otp has been saved' });
      }
    } catch (smsError) {
      console.error('Error sending SMS via Eskiz:', smsError.response?.data || smsError.message);
      return res.status(200).json({ message: 'Error sending SMS, but the otp is saved', error: smsError.message });
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


// Endpoint to handle forgot-password (Send OTP)
app.post('/forgot-password', async (req, res) => {
  const { phone, countryCode } = req.body;

  if (!phone || !countryCode) {
    return res.status(400).json({ message: 'Phone number and country code are required' });
  }

  const sanitizedPhone = phone.replace(/\D/g, '');
  const fullPhone = `${countryCode}${sanitizedPhone}`;

  try {
    // Check if the phone number exists in the users collection
    const userSnapshot = await db.collection('users').where('phone', '==', phone).get();
    if (userSnapshot.empty) {
      return res.status(400).json({ message: 'This phone number is not registered' });
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
          countryCode: '+998',
          from: '4546',
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        }
      );

      if (response.data.status === 'success' || response.data.status === 'waiting') {
        return res.status(200).json({ message: 'OTP sent successfully' });
      } else {
        console.error('Eskiz API Error:', response.data);
        return res.status(200).json({ message: 'Error sending OTP, but it has been saved' });
      }
    } catch (smsError) {
      console.error('Error sending OTP via Eskiz:', smsError.response?.data || smsError.message);
      return res.status(200).json({ message: 'Error sending OTP, but it has been saved', error: smsError.message });
    }
  } catch (error) {
    console.error('Error during forgot-password:', error.message);
    res.status(500).json({ message: 'Error occurred during forgot-password', error: error.message });
  }
});

// Endpoint to update password
app.post('/update-password', async (req, res) => {
  const { phone, code, newPassword, confirmPassword } = req.body;

  if (!phone || !code || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Phone, code, and passwords are required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  const sanitizedPhone = phone.replace(/\D/g, '');

  try {
    // Verify OTP
    const otpDocRef = db.collection('otps').doc(phone);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      return res.status(400).json({ message: 'OTP not found' });
    }

    const { otp } = otpDoc.data();
    if (code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const userSnapshot = await db.collection('users').where('phone', '==', phone).get();
    const userDoc = userSnapshot.docs[0];

    if (!userDoc) {
      return res.status(400).json({ message: 'User not found' });
    }

    await db.collection('users').doc(userDoc.id).update({
      password: hashedPassword,
    });

    // Delete OTP after successful password update
    await otpDocRef.delete();

    return res.status(200).json({ message: 'Password updated successfully. Please log in.' });
  } catch (error) {
    console.error('Error updating password:', error.message);
    res.status(500).json({ message: 'Error occurred during password update', error: error.message });
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
    // Query users collection where phone field matches the sanitized phone
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('phone', '==', sanitizedPhone).get();

    if (querySnapshot.empty) {
      return res.status(404).json({ message: 'Phone number not registered' });
    }

    // Get the first (and should be only) matching document
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // bcrypt.compare handles the secure password comparison
    if (await bcrypt.compare(password, userData.password)) {
      res.status(200).json({ 
        message: 'Login successful', 
        loggedIn: true,
        userId: userDoc.id  // Return the UUID
      });
    } else {
      res.status(400).json({ message: 'Phone number or password is incorrect' });
    }
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({
      message: 'Error occurred during login',
      error: error.message,
    });
  }
});

// Create new data
app.post('/api/data/create', async (req, res) => {
  const { userId, title, description } = req.body;

  if (!userId || !title || !description) {
    return res.status(400).json({ message: 'UserId, title, and description are required' });
  }

  try {
    // Get a reference to the user's data collection
    const dataRef = db.collection('users').doc(userId).collection('data');
    
    // Create new data document
    const newData = {
      title,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await dataRef.add(newData);
    
    res.status(201).json({
      message: 'Data created successfully',
      id: docRef.id,
      ...newData
    });
  } catch (error) {
    console.error('Error creating data:', error);
    res.status(500).json({ message: 'Error creating data', error: error.message });
  }
});

// Get all data for a user
app.get('/api/data/list/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const dataRef = db.collection('users').doc(userId).collection('data');
    const snapshot = await dataRef.orderBy('createdAt', 'desc').get();

    const data = [];
    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

// Get specific data item
app.get('/api/data/:userId/:id', async (req, res) => {
  const { userId, id } = req.params;

  try {
    const docRef = db.collection('users').doc(userId).collection('data').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Data not found' });
    }

    res.status(200).json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

// Update data
app.put('/api/data/:userId/:id', async (req, res) => {
  const { userId, id } = req.params;
  const { title, description } = req.body;

  if (!title && !description) {
    return res.status(400).json({ message: 'Title or description is required' });
  }

  try {
    const docRef = db.collection('users').doc(userId).collection('data').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Data not found' });
    }

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      updatedAt: new Date().toISOString()
    };

    await docRef.update(updateData);


    res.status(200).json({
      message: 'Data updated successfully',
      id,
      ...updateData
    });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({ message: 'Error updating data', error: error.message });
  }
});

// Delete data
app.delete('/api/data/:userId/:id', async (req, res) => {
  const { userId, id } = req.params;

  try {
    const docRef = db.collection('users').doc(userId).collection('data').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Data not found' });
    }

    await docRef.delete();

    res.status(200).json({
      message: 'Data deleted successfully',
      id
    });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ message: 'Error deleting data', error: error.message });
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


