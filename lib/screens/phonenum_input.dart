import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
// import 'package:export_app_sms/screens/main_page.dart';
import 'package:export_app_sms/screens/otp_verification.dart';

class RegistrationPage extends StatefulWidget {
  const RegistrationPage({super.key});

  @override
  // ignore: library_private_types_in_public_api
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
  bool _is2ndPasswordHidden = true;
  bool isloading = false;

// requests to BACKEND to send sms and save the users
  void _sendOtp() async {
    if (_formKey.currentState!.validate()) {
      final phone = _phoneController.text;
      setState(() {
        isloading = true;
      });
      try {
        final response = await http.post(
          Uri.parse('https://export-app-sms.onrender.com/send-sms'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'phone': phone, 'countryCode': "+998"}),
        );

        if (response.statusCode == 200) {
          final result = json.decode(response.body);

          if (result['message'] == 'User already exists') {
            _showSuccess(
              'A user with this phone number already exists. Please try to log in or register with a different phone number.',
            );
          } else if (result['message'] == 'SMS sent successfully') {
            _showOtpDialog(phone);
          } else {
            _showSuccess(result['message'] ?? 'Unknown error occurred.');
            _showOtpDialog(phone);
          }
        } else {
          final result = json.decode(response.body);
          _showError(
              'Error: ${response.statusCode}, $result[message],- Unable to send OTP.');
        }
      } catch (e) {
        _showError('Failed to send OTP: $e');
        _showOtpDialog(phone);
      } finally {
        setState(() {
          isloading = false;
        });
      }
    }
  }

//DIALOG for entering the verification code
  void _showOtpDialog(String phone) {
    showDialog(
      context: context,
      builder: (context) {
        return VerificationDialog(
          phone: phone,
          name: _nameController.text,
          password: _passwordController.text,
        );
      },
    );
  }

// FUNCTION FOR UNSUCCESSFULL RESPONSES
  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

// FUNCTION FOR SUCCESSFUL RESPONSES
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
              crossAxisAlignment: CrossAxisAlignment.center,
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
                  obscureText: _is2ndPasswordHidden,
                  decoration: InputDecoration(
                    labelText: 'Confirm Password',
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _is2ndPasswordHidden
                            ? Icons.visibility
                            : Icons.visibility_off,
                      ),
                      onPressed: () {
                        setState(() {
                          _is2ndPasswordHidden = !_is2ndPasswordHidden;
                        });
                      },
                    ),
                  ),
                  validator: (value) {
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                isloading
                 ? const CircularProgressIndicator()
                 : ElevatedButton(
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
