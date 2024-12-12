import 'package:export_app_sms/screens/phonenum_input.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';


class HomePage extends StatelessWidget {
  final String phone;

  HomePage({required this.phone});

  final _nameController = TextEditingController();

  //LOG OUT 
  Future<void> logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('verifiedPhone');
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => PhoneInputPage()),
      (route) => false,
    );
  }

  Future<void> updateName(String phone, String name) async {
    final userRef = FirebaseFirestore.instance.collection('users').doc(phone);
    await userRef.update({'name': name});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Welcome')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _nameController,
              decoration: InputDecoration(labelText: 'Enter your name'),
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                updateName(phone, _nameController.text.trim());
              },
              child: Text('Update Name'),
            ),
            ElevatedButton(onPressed: () => logout(context), child: const Text('log out'))
          ],
        ),
      ),
    );
  }
}
