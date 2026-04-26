import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String email;
  final String displayName;
  final String role; // 'PARENT' or 'CHILD'
  final String familyId;

  UserModel({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.role,
    required this.familyId,
  });

  factory UserModel.fromMap(Map<String, dynamic> data, String documentId) {
    return UserModel(
      uid: documentId,
      email: data['email'] ?? '',
      displayName: data['displayName'] ?? '',
      role: data['role'] ?? 'PARENT',
      familyId: data['familyId'] ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'displayName': displayName,
      'role': role,
      'familyId': familyId,
    };
  }
}
