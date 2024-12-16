import 'package:export_app_sms/screens/main_page.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:export_app_sms/screens/phonenum_input.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:export_app_sms/screens/transfers_page.dart';

Future<String?> getVerifiedPhoneNumber() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString('verifiedPhone');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  String? verifiedPhone = await getVerifiedPhoneNumber();
  runApp(MyApp(verifiedPhone: verifiedPhone));
}

class MyApp extends StatelessWidget {
  final String? verifiedPhone;

  MyApp({required this.verifiedPhone});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Phone Auth Demo',
      theme: ThemeData(primarySwatch: Colors.blue),
      routes: {
        "transfers" : (context) => const TransfersPage(),
      },
      home: verifiedPhone != null
          ? MainPage(phone: verifiedPhone!)
          : RegistrationPage(),
    );
  }
}
