import 'package:flutter/material.dart';
import 'package:export_app_sms/screens/phonenum_input.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SMS Verification App',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: PhoneInputPage(),
    );
  }
}
