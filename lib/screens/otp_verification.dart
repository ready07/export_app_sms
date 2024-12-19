import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:export_app_sms/screens/main_page.dart';
import 'package:shared_preferences/shared_preferences.dart';
// import 'package:export_app_sms/main.dart';

class VerificationDialog extends StatefulWidget {
  final String phone;
  final String name;
  final String password;
  const VerificationDialog(
      {super.key,
      required this.phone,
      required this.name,
      required this.password});

  @override
  State<VerificationDialog> createState() => _VerificationDialogState();
}

class _VerificationDialogState extends State<VerificationDialog> {
  final otpcontroller = TextEditingController();
  bool _isLoading = false;

  Future<void> savePhoneNumberLocally(String phone) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('verifiedPhone', phone);
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
    return AlertDialog(
      title: const Text('Enter OTP'),
      content: TextField(
        controller: otpcontroller,
        decoration: const InputDecoration(labelText: 'OTP'),
        keyboardType: TextInputType.number,
      ),
      actions: [
        _isLoading
            ? const CircularProgressIndicator()
            : TextButton(
                onPressed: () async {
                  final otp = otpcontroller.text;
                  final name = widget.name;
                  final password = widget.password;

                  setState(() {
                    _isLoading = true;
                  });

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
                        'phone': widget.phone,
                        'code': otp,
                        'name': name,
                        'password': password,
                        'countryCode': "+998"
                      }),
                    );

                    if (response.statusCode == 200) {
                      final result = json.decode(response.body);
                      if (result['message'] == 'User registered successfully') {
                        savePhoneNumberLocally(widget.phone);
                        Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(
                                builder: (context) =>
                                    MainPage(phone: widget.phone)),
                            (route) => false);
                        // Close the OTP dialog
                        _showSuccess('User registered successfully!');
                      } else {
                        _showError(result['message'] ?? 'Invalid OTP');
                      }
                    } else {
                      _showError(
                          'Failed to verify OTP: ${response.statusCode}');
                    }
                  } catch (e) {
                    _showError('Verification error: $e');
                  } finally {
                    setState(() {
                      _isLoading = false;
                    });
                  }
                },
                child: const Text('Verify'),
              ),
      ],
    );
  }
}


// import 'package:flutter/material.dart';
// import 'package:http/http.dart' as http;
// import 'dart:convert';
// import 'main_page.dart';
// import 'package:shared_preferences/shared_preferences.dart';

// class VerificationPage extends StatefulWidget {
//   final String phone;

//   VerificationPage({required this.phone});

//   @override
//   _VerificationPageState createState() => _VerificationPageState();
// }

// class _VerificationPageState extends State<VerificationPage> {
//   final _otpController = TextEditingController();
//   bool _isLoading = false;

//   Future<void> savePhoneNumberLocally(String phone) async {
//     final prefs = await SharedPreferences.getInstance();
//     await prefs.setString('verifiedPhone', phone);
//   }

//   Future<void> verifyOtp() async {
//     final otp = _otpController.text.trim();
//     if (otp.isEmpty) return;

//     setState(() {
//       _isLoading = true;
//     });

//     try {
//       final response = await http.post(
//         Uri.parse('https://export-app-sms.onrender.com/verify-code'),
//         headers: {'Content-Type': 'application/json'},
//         body: jsonEncode({'phone': widget.phone, 'code': otp}),
//       );

//       final data = jsonDecode(response.body);
//       if (response.statusCode == 200) {
//         savePhoneNumberLocally(widget.phone);
//         Navigator.pushReplacement(
//           context,
//           MaterialPageRoute(
//               builder: (context) => MainPage(phone: widget.phone)),
//         );
//       } else {
//         showError(data['message'] ?? 'Invalid OTP.');
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
//       appBar: AppBar(title: Text('Enter OTP')),
//       body: Padding(
//         padding: const EdgeInsets.all(16.0),
//         child: Column(
//           children: [
//             TextField(
//               controller: _otpController,
//               keyboardType: TextInputType.number,
//               decoration: InputDecoration(labelText: 'OTP'),
//             ),
//             SizedBox(height: 20),
//             _isLoading
//                 ? CircularProgressIndicator()
//                 : ElevatedButton(
//                     onPressed: verifyOtp,
//                     child: Text('Verify OTP'),
//                   ),
//           ],
//         ),
//       ),
//     );
//   }
// }