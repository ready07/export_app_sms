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
                message: 'This is test from Eskiz',
                from: '4546',
            },
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
            }
        );

        if (response.data.status === "success") {
            res.status(200).json({ message: 'SMS sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send SMS', details: response.data });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending SMS', error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});