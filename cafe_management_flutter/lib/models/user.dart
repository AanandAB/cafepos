class User {
  int? id;
  String name;
  String username;
  String password;
  UserRole role;
  bool active;
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

enum UserRole {
  admin,
  manager,
  staff,
  cashier,
}