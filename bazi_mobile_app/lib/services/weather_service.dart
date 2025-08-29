
class WeatherService {
  static WeatherService? _instance;
  static WeatherService get instance => _instance ??= WeatherService._();
  
  WeatherService._();

  // 使用免费的OpenWeatherMap API
  // 注意：在生产环境中，应该将API密钥存储在安全的地方
  static const String _apiKey = 'demo'; // 这里使用演示数据
  static const String _baseUrl = 'https://api.openweathermap.org/data/2.5';

  /// 根据坐标获取天气信息
  Future<Map<String, dynamic>?> getWeatherByCoordinates(double latitude, double longitude) async {
    try {
      // 由于这是演示版本，我们返回模拟数据
      // 在实际应用中，应该调用真实的天气API
      return _getMockWeatherData(latitude, longitude);
      
      /* 真实API调用代码（需要有效的API密钥）：
      final url = '$_baseUrl/weather?lat=$latitude&lon=$longitude&appid=$_apiKey&units=metric&lang=zh_cn';
      final response = await http.get(Uri.parse(url));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return _parseWeatherData(data);
      }
      */
    } catch (e) {
      print('获取天气信息失败: $e');
      return _getDefaultWeatherData();
    }
  }

  /// 根据城市名获取天气信息
  Future<Map<String, dynamic>?> getWeatherByCity(String cityName) async {
    try {
      // 演示版本返回模拟数据
      return _getMockWeatherDataByCity(cityName);
      
      /* 真实API调用代码：
      final url = '$_baseUrl/weather?q=$cityName&appid=$_apiKey&units=metric&lang=zh_cn';
      final response = await http.get(Uri.parse(url));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return _parseWeatherData(data);
      }
      */
    } catch (e) {
      print('获取天气信息失败: $e');
      return _getDefaultWeatherData();
    }
  }

  /// 解析天气API返回的数据
  Map<String, dynamic> _parseWeatherData(Map<String, dynamic> data) {
    return {
      'temperature': data['main']['temp'].round(),
      'description': data['weather'][0]['description'],
      'humidity': data['main']['humidity'],
      'windSpeed': data['wind']['speed'],
      'icon': data['weather'][0]['icon'],
      'cityName': data['name'],
    };
  }

  /// 获取模拟天气数据（基于坐标）
  Map<String, dynamic> _getMockWeatherData(double latitude, double longitude) {
    // 根据坐标生成不同的模拟数据
    final int seed = (latitude * longitude * 1000).abs().toInt();
    final List<Map<String, dynamic>> weatherOptions = [
      {
        'temperature': 22,
        'description': '晴朗',
        'humidity': 65,
        'windSpeed': 3.2,
        'icon': '01d',
      },
      {
        'temperature': 18,
        'description': '多云',
        'humidity': 72,
        'windSpeed': 2.8,
        'icon': '02d',
      },
      {
        'temperature': 15,
        'description': '小雨',
        'humidity': 85,
        'windSpeed': 4.1,
        'icon': '10d',
      },
      {
        'temperature': 25,
        'description': '阴天',
        'humidity': 58,
        'windSpeed': 2.3,
        'icon': '04d',
      },
    ];
    
    return weatherOptions[seed % weatherOptions.length];
  }

  /// 获取模拟天气数据（基于城市）
  Map<String, dynamic> _getMockWeatherDataByCity(String cityName) {
    // 根据城市名生成不同的模拟数据
    final Map<String, Map<String, dynamic>> cityWeather = {
      '北京': {
        'temperature': 20,
        'description': '晴朗',
        'humidity': 60,
        'windSpeed': 3.5,
        'icon': '01d',
      },
      '上海': {
        'temperature': 24,
        'description': '多云',
        'humidity': 75,
        'windSpeed': 2.8,
        'icon': '02d',
      },
      '广州': {
        'temperature': 28,
        'description': '阴天',
        'humidity': 80,
        'windSpeed': 2.1,
        'icon': '04d',
      },
      '深圳': {
        'temperature': 26,
        'description': '小雨',
        'humidity': 85,
        'windSpeed': 3.2,
        'icon': '10d',
      },
    };
    
    return cityWeather[cityName] ?? _getDefaultWeatherData();
  }

  /// 获取默认天气数据
  Map<String, dynamic> _getDefaultWeatherData() {
    return {
      'temperature': 22,
      'description': '晴朗',
      'humidity': 65,
      'windSpeed': 3.0,
      'icon': '01d',
    };
  }

  /// 根据天气图标获取对应的Flutter图标
  String getWeatherIcon(String iconCode) {
    switch (iconCode) {
      case '01d':
      case '01n':
        return 'wb_sunny'; // 晴天
      case '02d':
      case '02n':
      case '03d':
      case '03n':
        return 'wb_cloudy'; // 多云
      case '04d':
      case '04n':
        return 'cloud'; // 阴天
      case '09d':
      case '09n':
      case '10d':
      case '10n':
        return 'grain'; // 雨天
      case '11d':
      case '11n':
        return 'flash_on'; // 雷雨
      case '13d':
      case '13n':
        return 'ac_unit'; // 雪天
      case '50d':
      case '50n':
        return 'blur_on'; // 雾天
      default:
        return 'wb_sunny';
    }
  }
}