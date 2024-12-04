// Import dependencies
const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());

// Eskiz credentials
const ESKIZ_EMAIL = process.env.ESKIZ_EMAIL || "your_email@example.com";
const ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD || "your_password";
const ESKIZ_TOKEN = process.env.ESKIZ_TOKEN || "your_token";

// Endpoint to send SMS
app.post("/send-sms", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  try {
    // Send SMS using Eskiz API
    const response = await axios.post(
      "https://notify.eskiz.uz/api/message/sms/send",
      {
        mobile_phone: phone,
        message: "This is test from Eskiz",
        from: "4546", // Replace with your Sender ID (if applicable)
      },
      {
        headers: {
          Authorization: `Bearer ${ESKIZ_TOKEN}`,
        },
      }
    );

    if (response.data.status === "waiting") {
      res.json({ message: "SMS sent successfully", smsId: response.data.id });
    } else {
      res.status(400).json({ message: "Failed to send SMS", details: response.data });
    }
  } catch (error) {
    res.status(500).json({ message: "Error sending SMS", error: error.message });
  }
});

// Endpoint to verify SMS
app.post("/verify-sms", (req, res) => {
  const { userMessage } = req.body;

  if (userMessage === "This is test from Eskiz") {
    res.json({ message: "Verification successful" });
  } else {
    res.status(400).json({ message: "Verification failed" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
