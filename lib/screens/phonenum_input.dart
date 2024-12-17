import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class RegistrationPage extends StatefulWidget {
  const RegistrationPage({super.key});

  @override
  _RegistrationPageState createState() => _RegistrationPageState();
}

class _RegistrationPageState extends State<RegistrationPage> {
  final TextEditingController _phoneController =
      TextEditingController(text: '+998');
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  bool _isPasswordHidden = true;

  void _sendOtp() async {
    if (_formKey.currentState!.validate()) {
      final phone = _phoneController.text;
      try {
        final response = await http.post(
          Uri.parse('https://export-app-sms.onrender.com/send-sms'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'phone': phone}),
        );

        if (response.statusCode == 200) {
          final result = json.decode(response.body);

          if (result['message'] == 'User already exists') {
            _showError(
              'A user with this phone number already exists. Please try to log in or register with a different phone number.',
            );
          } else if (result['message'] == "OTP saved successfully. SMS delivery may have failed.") {
            _showOtpDialog(phone);
          } else {
            _showError(result['message'] ?? 'Unknown error occurred.');
          }
        } else {
          _showError('Error: ${response.statusCode} - Unable to send OTP.');
        }
      } catch (e) {
        _showError('Failed to send OTP: $e');
        _showOtpDialog(phone);
      }
    }
  }

  void _showOtpDialog(String phone) {
    showDialog(
      context: context,
      builder: (context) {
        final TextEditingController otpController = TextEditingController();

        return AlertDialog(
          title: const Text('Enter OTP'),
          content: TextField(
            controller: otpController,
            decoration: const InputDecoration(labelText: 'OTP'),
            keyboardType: TextInputType.number,
          ),
          actions: [
            TextButton(
              onPressed: () async {
                final otp = otpController.text;
                final name = _nameController.text;
                final password = _passwordController.text;

                if (otp.isEmpty) {
                  _showError('OTP cannot be empty');
                  return;
                }

                try {
                  final response = await http.post(
                    Uri.parse(
                        'https://export-app-sms.onrender.com/verify-code'),
                    headers: {'Content-Type': 'application/json'},
                    body: json.encode({
                      'phone': phone,
                      'code': otp,
                      'name': name,
                      'password': password,
                    }),
                  );

                  if (response.statusCode == 200) {
                    final result = json.decode(response.body);
                    if (result['message'] == 'User registered successfully') {
                      // ignore: use_build_context_synchronously
                      Navigator.of(context).pop(); // Close the OTP dialog
                      _showSuccess('User registered successfully!');
                    } else {
                      _showError(result['message'] ?? 'Invalid OTP');
                    }
                  } else {
                    _showError('Failed to verify OTP: ${response.statusCode}');
                  }
                } catch (e) {
                  _showError('Verification error: $e');
                }
              },
              child: const Text('Verify'),
            ),
          ],
        );
      },
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Register'),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Create Your Account',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Phone number is required';
                    } else if (!RegExp(r'^\+998\d{9}$').hasMatch(value)) {
                      return 'Invalid phone number format';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Full Name',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Full name is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _isPasswordHidden,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _isPasswordHidden
                            ? Icons.visibility
                            : Icons.visibility_off,
                      ),
                      onPressed: () {
                        setState(() {
                          _isPasswordHidden = !_isPasswordHidden;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Password is required';
                    } else if (value.length < 6) {
                      return 'Password must be at least 6 characters long';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Confirm Password',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _sendOtp,
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 50),
                  ),
                  child: const Text(
                    'Send OTP',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
