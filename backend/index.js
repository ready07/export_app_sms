require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Eskiz API configuration
const ESKIZ_EMAIL = process.env.ESKIZ_EMAIL;
const ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Endpoint to send SMS
app.post('/send-sms', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        const response = await axios.post(
            'https://notify.eskiz.uz/api/message/sms/send',
            {
                mobile_phone: phone,
                message: 'This is test from Eskiz', // Replace with dynamic code if needed
                from: '4546',
            },
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
            }
        );

        // Treat "waiting" as a successful response
        if (response.data.status === 'success' || response.data.status === 'waiting') {
            res.status(200).json({
                message: 'SMS sent successfully',
                details: response.data,
            });
        } else {
            res.status(400).json({
                message: 'Failed to send SMS',
                details: response.data,
            });
        }
    } catch (error) {
        console.error('Error sending SMS:', error.response?.data || error.message);
        res.status(500).json({
            message: 'Error occurred while sending SMS',
            error: error.response?.data || error.message,
        });
    }
});

// Endpoint to verify the code
app.post('/verify-code', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ message: 'Phone number and code are required' });
  }

  try {
    // Simulate verification (replace with actual logic if needed)
    const correctCode = 'This is test from Eskiz'; // Replace with dynamically generated code
    if (code === correctCode) {
      res.status(200).json({ message: 'Verification successful' });
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