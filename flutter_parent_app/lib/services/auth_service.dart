import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Stream of auth changes
  Stream<User?> get user => _auth.authStateChanges();

  // Register with email and password
  Future<UserModel?> register(String email, String password, String displayName, String role) async {
    try {
      UserCredential result = await _auth.createUserWithEmailAndPassword(
        email: email, 
        password: password
      );
      User? user = result.user;

      if (user != null) {
        // Create matching Firestore document
        UserModel newUser = UserModel(
          uid: user.uid,
          email: email,
          displayName: displayName,
          role: role,
          familyId: user.uid, // Default familyId is user's own UID for parents
        );

        await _db.collection('users').doc(user.uid).set(newUser.toMap()..addAll({
          'createdAt': FieldValue.serverTimestamp(),
        }));
        
        return newUser;
      }
    } catch (e) {
      print("Auth Service Error (Register): $e");
    }
    return null;
  }

  // Login with email and password
  Future<User?> login(String email, String password) async {
    try {
      UserCredential result = await _auth.signInWithEmailAndPassword(
        email: email, 
        password: password
      );
      return result.user;
    } catch (e) {
      print("Auth Service Error (Login): $e");
    }
    return null;
  }

  // Sign out
  Future<void> signOut() async {
    await _auth.signOut();
  }
}
