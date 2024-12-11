import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class HomePage extends StatelessWidget {
  final String phone;

  HomePage({required this.phone});

  final _nameController = TextEditingController();

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
          ],
        ),
      ),
    );
  }
}
