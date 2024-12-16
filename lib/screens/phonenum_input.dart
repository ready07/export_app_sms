import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert'; // for hashing
import 'package:http/http.dart' as http; // for API calls

class RegistrationPage extends StatefulWidget {
  @override
  _RegistrationPageState createState() => _RegistrationPageState();
}

class _RegistrationPageState extends State<RegistrationPage> {
  final TextEditingController _phoneController = TextEditingController(text: '+998');
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  bool _isPasswordHidden = true;

  void _sendOtp() async {
    if (_formKey.currentState!.validate()) {
      final phone = _phoneController.text;
      final name = _nameController.text;
      final password = _passwordController.text;

      try {
        final response = await http.post(
          Uri.parse('https://your-backend.com/send_otp'),
          body: {'phone': phone},
        );

        if (response.statusCode == 200) {
          final result = json.decode(response.body);
          if (result['success']) {
            _showOtpDialog(phone, name, password);
          } else {
            _showError(result['message'] ?? 'Unknown error');
          }
        } else {
          _showError('Failed to send OTP: ${response.statusCode}');
        }
      } catch (e) {
        _showError('Error: $e');
      }
    }
  }

  void _showOtpDialog(String phone, String name, String password) {
    showDialog(
      context: context,
      builder: (context) {
        final TextEditingController _otpController = TextEditingController();

        return AlertDialog(
          title: Text('Enter OTP'),
          content: TextField(
            controller: _otpController,
            decoration: InputDecoration(labelText: 'OTP'),
            keyboardType: TextInputType.number,
          ),
          actions: [
            TextButton(
              onPressed: () async {
                final otp = _otpController.text;
                try {
                  final response = await http.post(
                    Uri.parse('https://your-backend.com/verify_otp'),
                    body: {'phone': phone, 'otp': otp},
                  );

                  if (response.statusCode == 200) {
                    final result = json.decode(response.body);
                    if (result['success']) {
                      await _saveUserToFirestore(phone, name, password);
                      Navigator.of(context).pop();
                    } else {
                      _showError(result['message'] ?? 'Invalid OTP');
                    }
                  } else {
                    _showError('Failed to verify OTP: ${response.statusCode}');
                  }
                } catch (e) {
                  _showError('Error: $e');
                }
              },
              child: Text('Verify'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _saveUserToFirestore(String phone, String name, String password) async {
    final hashedPassword = sha256.convert(utf8.encode(password)).toString();

    await FirebaseFirestore.instance.collection('users').add({
      'phone': phone,
      'name': name,
      'password': hashedPassword,
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('User registered successfully!')),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Registration'),
      ),
      body: Center(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Create Your Account',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 20),
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(
                      labelText: 'Phone Number',
                      prefixText: '+998 ',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Phone number is required';
                      } else if (value.length < 9 || value.length > 12) {
                        return 'Invalid phone number';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: _nameController,
                    decoration: InputDecoration(
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
                  SizedBox(height: 16),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _isPasswordHidden,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      border: OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _isPasswordHidden ? Icons.visibility : Icons.visibility_off,
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
                        return 'Password must be at least 6 characters';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: _confirmPasswordController,
                    obscureText: true,
                    decoration: InputDecoration(
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
                  SizedBox(height: 24),
                  Center(
                    child: ElevatedButton(
                      onPressed: _sendOtp,
                      child: Text(
                        'Send OTP',
                        style: TextStyle(fontSize: 16),
                      ),
                      style: ElevatedButton.styleFrom(
                        minimumSize: Size(double.infinity, 50),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}



// import 'package:flutter/material.dart';
// import 'package:http/http.dart' as http;
// import 'dart:convert';
// import 'otp_verification.dart';
// import 'package:passwordfield/passwordfield.dart';

// class PhoneInputPage extends StatefulWidget {
//   @override
//   _PhoneInputPageState createState() => _PhoneInputPageState();
// }

// class _PhoneInputPageState extends State<PhoneInputPage> {
//   final _phoneController = TextEditingController();
//   final _nameController = TextEditingController();
//   final _passwordController = TextEditingController();
//   final _repeatPasswordCont = TextEditingController();
//   bool _isLoading = false;

//   Future<void> sendOtp() async {
//     final phone = _phoneController.text.trim();
//     if (phone.isEmpty) return;

//     setState(() {
//       _isLoading = true;
//     });

//     try {
//       final response = await http.post(
//         Uri.parse('https://export-app-sms.onrender.com/send-sms'),
//         headers: {'Content-Type': 'application/json'},
//         body: jsonEncode({'phone': phone}),
//       );

//       final data = jsonDecode(response.body);
//       if (response.statusCode == 200) {
//         Navigator.push(
//           context,
//           MaterialPageRoute(
//               builder: (context) => VerificationPage(phone: phone)),
//         );
//       } else {
//         showError(data['message'] ?? 'Failed to send OTP.');
//       }
//     } catch (e) {
//       showError('An error occurred: $e');
//     } finally {
//       setState(() {
//         _isLoading = false;
//       });
//     }
//   }

//   void showError(String message) {
//     ScaffoldMessenger.of(context)
//         .showSnackBar(SnackBar(content: Text(message)));
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(title: const Text('Enter Phone Number')),
//       body: Padding(
//         padding: const EdgeInsets.all(16.0),
//         child: Column(
//           children: [
//             TextField(
//               controller: _phoneController,
//               keyboardType: TextInputType.phone,
//               decoration: const InputDecoration(
//                 labelText: 'Enter a Phone Number',
//                 prefixText: '',
//                 border: OutlineInputBorder(),
//               ),
//               onChanged: (value) {
//                 if (!value.startsWith('+998')) {
//                   setState(() {
//                     _phoneController.text = '+998';
//                     _phoneController.selection = TextSelection.fromPosition(
//                       TextPosition(offset: _phoneController.text.length),
//                     );
//                   });
//                 }
//               },
//             ),
//             const SizedBox(height: 20),
//             TextField(
//               controller: _nameController,
//               keyboardType: TextInputType.name,
//               decoration: const InputDecoration(
//                   labelText: 'Enter your name', border: OutlineInputBorder()),
//             ),
//             const SizedBox(height: 20),
//             PasswordField(
//               controller: _passwordController,
//               color: Colors.grey,
//               passwordConstraint:AutofillHints.password,
//             ),
//             const SizedBox(height: 20),
//             _isLoading
//                 ? const CircularProgressIndicator()
//                 : ElevatedButton(
//                     onPressed: sendOtp,
//                     child: const Text('Send OTP'),
//                   ),
//           ],
//         ),
//       ),
//     );
//   }
// }
