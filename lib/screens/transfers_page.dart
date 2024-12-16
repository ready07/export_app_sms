import 'package:flutter/material.dart';

class TransfersPage extends StatefulWidget {
  const TransfersPage({super.key});

  @override
  State<TransfersPage> createState() => _TransfersPageState();
}

class _TransfersPageState extends State<TransfersPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Transfers Page'),
      ),
    );
  }
}
