class BaziModel {
  final String year;
  final String month;
  final String day;
  final String hour;
  final String yearGan;
  final String yearZhi;
  final String monthGan;
  final String monthZhi;
  final String dayGan;
  final String dayZhi;
  final String hourGan;
  final String hourZhi;
  final String gender;
  final String solarDate;
  final String lunarDate;

  BaziModel({
    required this.year,
    required this.month,
    required this.day,
    required this.hour,
    required this.yearGan,
    required this.yearZhi,
    required this.monthGan,
    required this.monthZhi,
    required this.dayGan,
    required this.dayZhi,
    required this.hourGan,
    required this.hourZhi,
    required this.gender,
    required this.solarDate,
    required this.lunarDate,
  });

  Map<String, dynamic> toJson() {
    return {
      'year': year,
      'month': month,
      'day': day,
      'hour': hour,
      'yearGan': yearGan,
      'yearZhi': yearZhi,
      'monthGan': monthGan,
      'monthZhi': monthZhi,
      'dayGan': dayGan,
      'dayZhi': dayZhi,
      'hourGan': hourGan,
      'hourZhi': hourZhi,
      'gender': gender,
      'solarDate': solarDate,
      'lunarDate': lunarDate,
    };
  }

  factory BaziModel.fromJson(Map<String, dynamic> json) {
    return BaziModel(
      year: json['year'] ?? '',
      month: json['month'] ?? '',
      day: json['day'] ?? '',
      hour: json['hour'] ?? '',
      yearGan: json['yearGan'] ?? '',
      yearZhi: json['yearZhi'] ?? '',
      monthGan: json['monthGan'] ?? '',
      monthZhi: json['monthZhi'] ?? '',
      dayGan: json['dayGan'] ?? '',
      dayZhi: json['dayZhi'] ?? '',
      hourGan: json['hourGan'] ?? '',
      hourZhi: json['hourZhi'] ?? '',
      gender: json['gender'] ?? '',
      solarDate: json['solarDate'] ?? '',
      lunarDate: json['lunarDate'] ?? '',
    );
  }
}

class WealthAnalysis {
  final int totalScore;
  final double wealthStarQuality;
  final double wealthStarFlow;
  final double tenGodsCombo;
  final String level;
  final String description;
  final String? wealthClass;
  final List<String> details;

  WealthAnalysis({
    required this.totalScore,
    required this.wealthStarQuality,
    required this.wealthStarFlow,
    required this.tenGodsCombo,
    required this.level,
    required this.description,
    this.wealthClass,
    required this.details,
  });

  Map<String, dynamic> toJson() {
    return {
      'totalScore': totalScore,
      'wealthStarQuality': wealthStarQuality,
      'wealthStarFlow': wealthStarFlow,
      'tenGodsCombo': tenGodsCombo,
      'level': level,
      'description': description,
      'class': wealthClass,
      'details': details,
    };
  }

  factory WealthAnalysis.fromJson(Map<String, dynamic> json) {
    return WealthAnalysis(
      totalScore: (json['totalScore'] ?? 0).round(),
      wealthStarQuality: (json['wealthStarQuality'] ?? 0.0).toDouble(),
      wealthStarFlow: (json['wealthStarFlow'] ?? 0.0).toDouble(),
      tenGodsCombo: (json['tenGodsCombo'] ?? 0.0).toDouble(),
      level: json['level'] ?? '',
      description: json['description'] ?? '',
      wealthClass: json['class'],
      details: List<String>.from(json['details'] ?? []),
    );
  }
}

class FateAnalysis {
  final int totalScore;
  final String level;
  final String description;
  final String? fateClass;
  final List<String> details;

  FateAnalysis({
    required this.totalScore,
    required this.level,
    required this.description,
    this.fateClass,
    required this.details,
  });

  Map<String, dynamic> toJson() {
    return {
      'totalScore': totalScore,
      'level': level,
      'description': description,
      'class': fateClass,
      'details': details,
    };
  }

  factory FateAnalysis.fromJson(Map<String, dynamic> json) {
    return FateAnalysis(
      totalScore: (json['totalScore'] ?? 0).round(),
      level: json['level'] ?? '',
      description: json['description'] ?? '',
      fateClass: json['class'],
      details: List<String>.from(json['details'] ?? []),
    );
  }
}

class UserModel {
  final String? id;
  final String? username;
  final double balance;
  final String? token;
  final PersonalBaziInfo? personalBazi;

  UserModel({
    this.id, 
    this.username, 
    required this.balance, 
    this.token,
    this.personalBazi,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id, 
      'username': username, 
      'balance': balance, 
      'token': token,
      'personalBazi': personalBazi?.toJson(),
    };
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      username: json['username'],
      balance: (json['balance'] ?? 0.0).toDouble(),
      token: json['token'],
      personalBazi: json['personalBazi'] != null 
          ? PersonalBaziInfo.fromJson(json['personalBazi']) 
          : null,
    );
  }

  UserModel copyWith({
    String? id,
    String? username,
    double? balance,
    String? token,
    PersonalBaziInfo? personalBazi,
  }) {
    return UserModel(
      id: id ?? this.id,
      username: username ?? this.username,
      balance: balance ?? this.balance,
      token: token ?? this.token,
      personalBazi: personalBazi ?? this.personalBazi,
    );
  }
}

class PersonalBaziInfo {
  final String name;
  final String birthDate;
  final String birthTime;
  final String gender;
  final String? solarDate;
  final String? lunarDate;
  final BaziModel? baziData;
  final DateTime createdAt;
  final DateTime updatedAt;

  PersonalBaziInfo({
    required this.name,
    required this.birthDate,
    required this.birthTime,
    required this.gender,
    this.solarDate,
    this.lunarDate,
    this.baziData,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'birthDate': birthDate,
      'birthTime': birthTime,
      'gender': gender,
      'solarDate': solarDate,
      'lunarDate': lunarDate,
      'baziData': baziData?.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory PersonalBaziInfo.fromJson(Map<String, dynamic> json) {
    return PersonalBaziInfo(
      name: json['name'] ?? '',
      birthDate: json['birthDate'] ?? '',
      birthTime: json['birthTime'] ?? '',
      gender: json['gender'] ?? '',
      solarDate: json['solarDate'],
      lunarDate: json['lunarDate'],
      baziData: json['baziData'] != null 
          ? BaziModel.fromJson(json['baziData']) 
          : null,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  PersonalBaziInfo copyWith({
    String? name,
    String? birthDate,
    String? birthTime,
    String? gender,
    String? solarDate,
    String? lunarDate,
    BaziModel? baziData,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return PersonalBaziInfo(
      name: name ?? this.name,
      birthDate: birthDate ?? this.birthDate,
      birthTime: birthTime ?? this.birthTime,
      gender: gender ?? this.gender,
      solarDate: solarDate ?? this.solarDate,
      lunarDate: lunarDate ?? this.lunarDate,
      baziData: baziData ?? this.baziData,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
