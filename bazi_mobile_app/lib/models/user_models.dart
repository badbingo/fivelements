/// 用户相关数据模型
library;

/// 用户信息
class User {
  final String id;
  final String username;
  final String email;
  final String? avatar;
  final double balance;
  final DateTime createdAt;
  final DateTime? lastLoginAt;
  final UserProfile? profile;

  User({
    required this.id,
    required this.username,
    required this.email,
    this.avatar,
    required this.balance,
    required this.createdAt,
    this.lastLoginAt,
    this.profile,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'avatar': avatar,
      'balance': balance,
      'createdAt': createdAt.toIso8601String(),
      'lastLoginAt': lastLoginAt?.toIso8601String(),
      'profile': profile?.toJson(),
    };
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString() ?? '',
      email: json['email']?.toString() ?? 'user@example.com',
      avatar: json['avatar'],
      balance: (json['balance'] as num?)?.toDouble() ?? 0.0,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.parse(json['lastLoginAt'])
          : null,
      profile: json['profile'] != null
          ? UserProfile.fromJson(json['profile'])
          : null,
    );
  }

  User copyWith({
    String? id,
    String? username,
    String? email,
    String? avatar,
    double? balance,
    DateTime? createdAt,
    DateTime? lastLoginAt,
    UserProfile? profile,
  }) {
    return User(
      id: id ?? this.id,
      username: username ?? this.username,
      email: email ?? this.email,
      avatar: avatar ?? this.avatar,
      balance: balance ?? this.balance,
      createdAt: createdAt ?? this.createdAt,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
      profile: profile ?? this.profile,
    );
  }
}

/// 用户资料
class UserProfile {
  final String? realName;
  final String? gender;
  final DateTime? birthDate;
  final String? birthPlace;
  final String? phone;
  final Map<String, dynamic>? preferences;

  UserProfile({
    this.realName,
    this.gender,
    this.birthDate,
    this.birthPlace,
    this.phone,
    this.preferences,
  });

  Map<String, dynamic> toJson() {
    return {
      'realName': realName,
      'gender': gender,
      'birthDate': birthDate?.toIso8601String(),
      'birthPlace': birthPlace,
      'phone': phone,
      'preferences': preferences,
    };
  }

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      realName: json['realName'],
      gender: json['gender'],
      birthDate: json['birthDate'] != null
          ? DateTime.parse(json['birthDate'])
          : null,
      birthPlace: json['birthPlace'],
      phone: json['phone'],
      preferences: json['preferences'],
    );
  }
}

/// 认证结果
class AuthResult {
  final bool success;
  final String? token;
  final User? user;
  final String? message;
  final DateTime? expiresAt;

  AuthResult({
    required this.success,
    this.token,
    this.user,
    this.message,
    this.expiresAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'token': token,
      'user': user?.toJson(),
      'message': message,
      'expiresAt': expiresAt?.toIso8601String(),
    };
  }

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      success: json['success'] ?? false,
      token: json['token'],
      user: json['user'] != null ? User.fromJson(json['user']) : null,
      message: json['message'],
      expiresAt: json['expiresAt'] != null
          ? DateTime.parse(json['expiresAt'])
          : null,
    );
  }
}

/// 登录请求
class LoginRequest {
  final String username;
  final String password;
  final bool rememberMe;

  LoginRequest({
    required this.username,
    required this.password,
    this.rememberMe = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'password': password,
      'rememberMe': rememberMe,
    };
  }
}

/// 注册请求
class RegisterRequest {
  final String username;
  final String email;
  final String password;
  final String confirmPassword;
  final bool agreeToTerms;

  RegisterRequest({
    required this.username,
    required this.email,
    required this.password,
    required this.confirmPassword,
    this.agreeToTerms = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'email': email,
      'password': password,
      'confirmPassword': confirmPassword,
      'agreeToTerms': agreeToTerms,
    };
  }

  bool get isValid {
    return username.isNotEmpty &&
        email.isNotEmpty &&
        password.isNotEmpty &&
        password == confirmPassword &&
        agreeToTerms;
  }
}

/// 密码重置请求
class PasswordResetRequest {
  final String email;

  PasswordResetRequest({required this.email});

  Map<String, dynamic> toJson() {
    return {'email': email};
  }
}

/// 用户设置
class UserSettings {
  final bool enableNotifications;
  final bool enablePushNotifications;
  final String language;
  final String theme;
  final bool enableBiometric;
  final Map<String, dynamic>? customSettings;

  UserSettings({
    this.enableNotifications = true,
    this.enablePushNotifications = true,
    this.language = 'zh-CN',
    this.theme = 'system',
    this.enableBiometric = false,
    this.customSettings,
  });

  Map<String, dynamic> toJson() {
    return {
      'enableNotifications': enableNotifications,
      'enablePushNotifications': enablePushNotifications,
      'language': language,
      'theme': theme,
      'enableBiometric': enableBiometric,
      'customSettings': customSettings,
    };
  }

  factory UserSettings.fromJson(Map<String, dynamic> json) {
    return UserSettings(
      enableNotifications: json['enableNotifications'] ?? true,
      enablePushNotifications: json['enablePushNotifications'] ?? true,
      language: json['language'] ?? 'zh-CN',
      theme: json['theme'] ?? 'system',
      enableBiometric: json['enableBiometric'] ?? false,
      customSettings: json['customSettings'],
    );
  }

  UserSettings copyWith({
    bool? enableNotifications,
    bool? enablePushNotifications,
    String? language,
    String? theme,
    bool? enableBiometric,
    Map<String, dynamic>? customSettings,
  }) {
    return UserSettings(
      enableNotifications: enableNotifications ?? this.enableNotifications,
      enablePushNotifications:
          enablePushNotifications ?? this.enablePushNotifications,
      language: language ?? this.language,
      theme: theme ?? this.theme,
      enableBiometric: enableBiometric ?? this.enableBiometric,
      customSettings: customSettings ?? this.customSettings,
    );
  }
}

/// 用户统计信息
class UserStats {
  final int totalCalculations;
  final int totalDays;
  final double totalSpent;
  final int favoriteRecords;
  final DateTime? lastCalculation;
  final Map<String, int>? monthlyStats;

  UserStats({
    required this.totalCalculations,
    required this.totalDays,
    required this.totalSpent,
    required this.favoriteRecords,
    this.lastCalculation,
    this.monthlyStats,
  });

  Map<String, dynamic> toJson() {
    return {
      'totalCalculations': totalCalculations,
      'totalDays': totalDays,
      'totalSpent': totalSpent,
      'favoriteRecords': favoriteRecords,
      'lastCalculation': lastCalculation?.toIso8601String(),
      'monthlyStats': monthlyStats,
    };
  }

  factory UserStats.fromJson(Map<String, dynamic> json) {
    return UserStats(
      totalCalculations: json['totalCalculations'] ?? 0,
      totalDays: json['totalDays'] ?? 0,
      totalSpent: (json['totalSpent'] ?? 0.0).toDouble(),
      favoriteRecords: json['favoriteRecords'] ?? 0,
      lastCalculation: json['lastCalculation'] != null
          ? DateTime.parse(json['lastCalculation'])
          : null,
      monthlyStats: json['monthlyStats'] != null
          ? Map<String, int>.from(json['monthlyStats'])
          : null,
    );
  }
}
