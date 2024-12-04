import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:export_app_sms/screens/phonenum_input.dart';
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Export',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: const PhoneInputScreen(),
    );
  }
}
