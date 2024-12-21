import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:export_app_sms/screens/update_password.dart';

class ForgotPasswordScreen extends StatefulWidget {
  @override
  _ForgotPasswordScreenState createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _phoneController = TextEditingController();
  final _countryCodeController = TextEditingController(text: "+998");

  Future<void> sendOtp() async {
    final phone = _phoneController.text.trim();
    final countryCode = _countryCodeController.text.trim();

    if (phone.isEmpty || countryCode.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text("Please enter your phone number and country code."),
      ));
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('https://export-app-sms.onrender.com/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'phone': phone, 'countryCode': countryCode}),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text("OTP sent successfully."),
        ));
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => UpdatePasswordScreen(phone: phone),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(data['message']),
        ));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text("An error occurred. Please try again."),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Forgot Password")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _countryCodeController,
              decoration: InputDecoration(labelText: "Country Code"),
            ),
            TextField(
              controller: _phoneController,
              decoration: InputDecoration(labelText: "Phone Number"),
              keyboardType: TextInputType.phone,
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: sendOtp,
              child: Text("Send OTP"),
            ),
          ],
        ),
      ),
    );
  }
}
