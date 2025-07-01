import 'package:hive/hive.dart';

part 'table.g.dart';

@HiveType(typeId: 9)
class TableModel extends HiveObject {
  @HiveField(0)
  int? id;

  @HiveField(1)
  String name;

  @HiveField(2)
  int? capacity;

  @HiveField(3)
  bool occupied;

  TableModel({
    this.id,
    required this.name,
    this.capacity,
    this.occupied = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'capacity': capacity,
      'occupied': occupied ? 1 : 0,
    };
  }

  factory TableModel.fromMap(Map<String, dynamic> map) {
    return TableModel(
      id: map['id'],
      name: map['name'],
      capacity: map['capacity'],
      occupied: map['occupied'] == 1,
    );
  }
}