# 八字App混合架构设计方案
## 30%原生UI + 70%网页架构

### 1. 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Flutter App Shell                        │
├─────────────────────────────────────────────────────────────┤
│  原生UI模块 (30%)           │  WebView模块 (70%)            │
│  ├─ 用户认证系统             │  ├─ 详细八字分析              │
│  ├─ 主导航/Tab栏            │  ├─ 高级功能页面              │
│  ├─ 八字输入界面             │  ├─ 支付充值页面              │
│  ├─ 结果展示页面             │  ├─ 历史记录详情              │
│  ├─ 个人中心                │  ├─ 问答系统                  │
│  └─ 设置页面                │  └─ 其他辅助功能              │
└─────────────────────────────────────────────────────────────┘
```

### 2. 原生UI模块设计 (30%)

#### 2.1 用户认证系统
- **Apple Sign In集成**
- **传统登录/注册表单**
- **密码重设流程**
- **用户状态管理**

#### 2.2 主导航系统
- **底部Tab栏**: 首页、历史、个人中心、设置
- **顶部导航栏**: 标题、用户头像、余额显示
- **侧边抽屉**: 快速功能入口

#### 2.3 八字输入界面
- **姓名输入**: 原生TextField
- **日期选择器**: 原生DatePicker
- **时间选择器**: 原生TimePicker
- **性别选择**: 原生Radio按钮
- **计算按钮**: 原生Button

#### 2.4 结果展示页面
- **八字排盘**: 原生Grid布局
- **五行分析**: Chart.js图表
- **身强身弱**: 进度条显示
- **基础分析**: 卡片式布局
- **操作按钮**: 详批、分享、收藏

#### 2.5 个人中心
- **用户信息**: 头像、昵称、等级
- **余额显示**: 实时更新
- **功能入口**: 历史记录、设置、帮助
- **统计信息**: 使用次数、注册时间

#### 2.6 设置页面
- **主题设置**: 明暗模式切换
- **通知设置**: 推送开关
- **隐私设置**: 数据清理
- **关于页面**: 版本信息

### 3. WebView模块设计 (70%)

#### 3.1 详细八字分析
- **完整排盘**: 保留现有HTML页面
- **十神分析**: 复杂逻辑保持网页实现
- **大运流年**: 时间轴展示
- **专业术语**: 详细解释

#### 3.2 高级功能页面
- **合婚分析**: hehun.html
- **六爻占卜**: 六爻相关页面
- **许愿池**: 互动功能
- **游戏模块**: 娱乐功能

#### 3.3 支付充值系统
- **充值页面**: stripe_recharge.html
- **支付流程**: 现有支付逻辑
- **订单管理**: 交易记录
- **余额管理**: 账户系统

#### 3.4 问答系统
- **AI问答**: 现有问答逻辑
- **知识库**: 八字知识
- **FAQ**: 常见问题
- **客服系统**: 在线支持

### 4. API服务层设计

#### 4.1 BaziApiService
```dart
class BaziApiService {
  static const String baseUrl = 'http://localhost:3000';
  
  // 八字计算API
  Future<BaziResult> calculateBazi(BaziInput input) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/calculate'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(input.toJson()),
    );
    return BaziResult.fromJson(json.decode(response.body));
  }
  
  // 用户认证API
  Future<AuthResult> login(String username, String password) async {
    // 调用现有登录接口
  }
  
  // Apple登录API
  Future<AuthResult> appleSignIn(AppleCredential credential) async {
    // 集成Apple登录
  }
  
  // 历史记录API
  Future<List<BaziRecord>> getHistory(String userId) async {
    // 获取用户历史记录
  }
}
```

#### 4.2 数据模型
```dart
class BaziInput {
  final String name;
  final DateTime birthDate;
  final TimeOfDay birthTime;
  final String gender;
  
  Map<String, dynamic> toJson() => {
    'name': name,
    'year': birthDate.year,
    'month': birthDate.month,
    'day': birthDate.day,
    'hour': birthTime.hour,
    'minute': birthTime.minute,
    'gender': gender,
  };
}

class BaziResult {
  final String yearPillar;
  final String monthPillar;
  final String dayPillar;
  final String hourPillar;
  final List<int> elements;
  final String strengthType;
  final double strengthScore;
  final String personality;
  
  factory BaziResult.fromJson(Map<String, dynamic> json) {
    return BaziResult(
      yearPillar: json['yearPillar'],
      monthPillar: json['monthPillar'],
      dayPillar: json['dayPillar'],
      hourPillar: json['hourPillar'],
      elements: List<int>.from(json['elements']),
      strengthType: json['strengthType'],
      strengthScore: json['strengthScore'].toDouble(),
      personality: json['personality'],
    );
  }
}
```

### 5. 页面路由设计

#### 5.1 原生页面路由
```dart
class AppRoutes {
  static const String splash = '/splash';
  static const String auth = '/auth';
  static const String home = '/home';
  static const String input = '/input';
  static const String result = '/result';
  static const String profile = '/profile';
  static const String settings = '/settings';
  static const String history = '/history';
}
```

#### 5.2 WebView页面路由
```dart
class WebViewRoutes {
  static const String detailedAnalysis = '/webview/detailed';
  static const String hehun = '/webview/hehun';
  static const String liuyao = '/webview/liuyao';
  static const String recharge = '/webview/recharge';
  static const String qa = '/webview/qa';
}
```

### 6. 状态管理设计

#### 6.1 Provider架构
```dart
// 用户状态管理
class UserProvider extends ChangeNotifier {
  User? _user;
  bool _isLoggedIn = false;
  double _balance = 0.0;
  
  // getter和setter方法
  // 登录、登出、更新余额等方法
}

// 八字计算状态管理
class BaziProvider extends ChangeNotifier {
  BaziInput? _currentInput;
  BaziResult? _currentResult;
  List<BaziRecord> _history = [];
  
  // 计算、保存、加载历史等方法
}

// 应用设置状态管理
class SettingsProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.system;
  bool _notificationsEnabled = true;
  
  // 设置相关方法
}
```

### 7. 实施计划

#### 阶段一：基础架构 (1-2周)
1. 创建Flutter项目结构
2. 集成WebView组件
3. 实现基础路由系统
4. 创建API服务层

#### 阶段二：核心功能 (2-3周)
1. 实现用户认证系统
2. 创建八字输入界面
3. 实现结果展示页面
4. 集成现有计算逻辑

#### 阶段三：完善功能 (1-2周)
1. 实现主导航系统
2. 创建个人中心页面
3. 实现设置功能
4. 优化用户体验

#### 阶段四：测试优化 (1周)
1. 功能测试
2. 性能优化
3. UI/UX调优
4. 准备上架

### 8. 技术栈

- **Flutter**: 3.16+
- **Dart**: 3.2+
- **WebView**: webview_flutter 4.4+
- **HTTP**: http 1.1+
- **状态管理**: provider 6.1+
- **本地存储**: shared_preferences 2.2+
- **Apple登录**: sign_in_with_apple 4.3+
- **图表**: fl_chart 0.65+

### 9. 预期效果

- **原生体验**: 30%的核心功能原生化，提升用户体验
- **开发效率**: 70%功能保持网页实现，快速迁移
- **审核通过**: 满足App Store对原生功能的要求
- **维护成本**: 渐进式迁移，降低重构风险
- **性能提升**: 关键路径原生化，提升响应速度

### 10. 风险控制

- **兼容性**: 确保WebView与原生组件的无缝集成
- **数据同步**: 原生和网页数据状态保持一致
- **性能监控**: 监控WebView加载性能
- **用户体验**: 确保原生和网页切换的流畅性
- **安全性**: 保护用户数据和支付信息安全