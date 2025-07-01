import 'package:hive/hive.dart';

part 'user.g.dart';

@HiveType(typeId: 0)
class User extends HiveObject {
  @HiveField(0)
  int? id;

  @HiveField(1)
  String name;

  @HiveField(2)
  String username;

  @HiveField(3)
  String password;

  @HiveField(4)
  UserRole role;

  @HiveField(5)
  bool active;

  @HiveField(6)
  DateTime createdAt;

  User({
    this.id,
    required this.name,
    required this.username,
    required this.password,
    this.role = UserRole.staff,
    this.active = true,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'password': password,
      'role': role.name,
      'active': active ? 1 : 0,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'],
      name: map['name'],
      username: map['username'],
      password: map['password'],
      role: UserRole.values.firstWhere((e) => e.name == map['role']),
      active: map['active'] == 1,
      createdAt: DateTime.parse(map['createdAt']),
    );
  }
}

@HiveType(typeId: 1)
enum UserRole {
  @HiveField(0)
  admin,
  @HiveField(1)
  manager,
  @HiveField(2)
  staff,
  @HiveField(3)
  cashier,
}