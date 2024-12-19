import 'package:export_app_sms/screens/phonenum_input.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';


class MainPage extends StatefulWidget {
  final String phone;
  MainPage({required this.phone});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  final _nameController = TextEditingController();
  

  

  Future<void> updateName(String phone, String name) async {
    final userRef = FirebaseFirestore.instance.collection('users').doc(phone);
    await userRef.update({'name': name});
  }

 int _selectedIndex = 0;

  // List of pages for bottom navigation
  static final List<Widget> _pages = <Widget>[
    const HomePage(),
    const SettingsPage(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_selectedIndex == 0 ? "Asosiy" : "Sozlamalar",style:const TextStyle(color: Colors.white),),
        backgroundColor: const Color.fromARGB(255, 86, 82, 119),
      ),
      body: _pages[_selectedIndex], // Display selected page
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Asosiy',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Sozlamalar',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.blue,
        onTap: _onItemTapped, // Handle navigation when tapped
      ),
    );
  }
}

// home page
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
          ElevatedButton(onPressed: () => Navigator.of(context).pushNamed('transfers'), child: const Column(children: [
            Icon(Icons.autorenew_rounded),
            Text("O'tkazmalar")
          ],)),
          ElevatedButton(onPressed: (){}, child: const Column(children: [
            Icon(Icons.calendar_view_week_sharp),
            Text('Yashiq')
          ],))
        ],),
        Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
          ElevatedButton(onPressed: (){}, child: const Column(children: [
            Icon(Icons.people_alt_sharp),
            Text("Ishchilar")
          ],)),
          ElevatedButton(onPressed: (){}, child: const Column(children: [
            Icon(Icons.air_outlined),
            Text('Muzlatkich')
          ],))
        ],),
        Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
          ElevatedButton(onPressed: (){}, child: const Column(children: [
            Icon(Icons.fire_truck_outlined),
            Text("Transport")
          ],)),
          ElevatedButton(onPressed: (){}, child: const Column(children: [
            Icon(Icons.post_add_rounded),
            Text('Mahsulot')
          ],))
        ],),
        Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
          ElevatedButton(onPressed: (){}, child: const Column(children: [
            Icon(Icons.poll_outlined),
            Text("Statistika")
          ],)),
          ElevatedButton(onPressed: (){}, child: const Column(children: [
            Icon(Icons.view_in_ar_sharp),
            Text('Boshqa')
          ],))
        ],)
      ],
    );
  }
}

// settings page
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  //LOG OUT 
  Future<void> logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('verifiedPhone');
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => RegistrationPage()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ElevatedButton(onPressed: () => logout(context), child: const Text('log out')),
          const Text("Welcome to the Settings Page!"),
        ],
      ),
    );
  }
}





// class HomePage extends StatelessWidget {
//   final String phone;
//   HomePage({required this.phone});
//   final _nameController = TextEditingController();


//   //LOG OUT 
//   Future<void> logout(BuildContext context) async {
//     final prefs = await SharedPreferences.getInstance();
//     await prefs.remove('verifiedPhone');
//     Navigator.pushAndRemoveUntil(
//       context,
//       MaterialPageRoute(builder: (context) => PhoneInputPage()),
//       (route) => false,
//     );
//   }

//   Future<void> updateName(String phone, String name) async {
//     final userRef = FirebaseFirestore.instance.collection('users').doc(phone);
//     await userRef.update({'name': name});
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(title: Text('Welcome')),
//       body: Padding(
//         padding: const EdgeInsets.all(16.0),
//         child: Column(
//           children: [
//             TextField(
//               controller: _nameController,
//               decoration: InputDecoration(labelText: 'Enter your name'),
//             ),
//             SizedBox(height: 20),
//             ElevatedButton(
//               onPressed: () {
//                 updateName(phone, _nameController.text.trim());
//               },
//               child: Text('Update Name'),
//             ),
//             ElevatedButton(onPressed: () => logout(context), child: const Text('log out'))
//           ],
//         ),
//       ),
//     );
//   }
// }
