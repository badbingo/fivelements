import '../models/bazi_model.dart';
import 'mingge_analysis_service.dart';

class ElementEnergyService {
  // 五行名称映射
  static const List<String> elementNames = ['木', '火', '土', '金', '水'];
  static const List<String> energyNames = ['财运', '事业', '感情', '健康', '学业'];

  // 五行颜色映射
  static const Map<String, int> elementColors = {
    '木': 0xFF4CAF50, // 绿色
    '火': 0xFFF44336, // 红色
    '土': 0xFFFF9800, // 橙色
    '金': 0xFFFFD700, // 金色
    '水': 0xFF2196F3, // 蓝色
  };

  // 运势颜色映射
  static const Map<String, int> energyColors = {
    '财运': 0xFFFFD700, // 金色
    '事业': 0xFF4CAF50, // 绿色
    '感情': 0xFFF44336, // 红色
    '健康': 0xFF2196F3, // 蓝色
    '学业': 0xFF9C27B0, // 紫色
  };

  /// 获取今日五行能量数据
  /// 如果用户设置了八字，返回真实计算的数据；否则返回模拟数据
  static Map<String, dynamic> getTodayElementEnergy(
    PersonalBaziInfo? personalBazi,
  ) {
    if (personalBazi?.baziData != null) {
      return _calculateRealElementEnergy(personalBazi!.baziData!);
    } else {
      return _getMockElementEnergy();
    }
  }

  /// 计算真实的五行能量数据
  static Map<String, dynamic> _calculateRealElementEnergy(BaziModel baziData) {
    // 构建八字柱信息
    final pillars = {
      'year': '${baziData.yearGan}${baziData.yearZhi}',
      'month': '${baziData.monthGan}${baziData.monthZhi}',
      'day': '${baziData.dayGan}${baziData.dayZhi}',
      'hour': '${baziData.hourGan}${baziData.hourZhi}',
    };

    // 使用 MinggeAnalysisService 计算五行能量
    final elementEnergy = MinggeAnalysisService.calculateElementEnergy(pillars);

    // 转换为数组格式，按照木火土金水的顺序
    final energyValues = elementNames
        .map((element) => (elementEnergy[element] ?? 0.0))
        .toList();

    // 归一化到0-1范围
    final maxEnergy = energyValues.reduce((a, b) => a > b ? a : b);
    final normalizedValues = maxEnergy > 0
        ? energyValues.map((value) => value / maxEnergy).toList()
        : [0.2, 0.2, 0.2, 0.2, 0.2]; // 如果全为0，给默认值

    // 构建五行能量数据
    final elementData = List.generate(
      5,
      (index) => {
        'name': elementNames[index],
        'value': normalizedValues[index],
        'color': elementColors[elementNames[index]]!,
      },
    );

    // 基于五行能量计算运势能量（添加一些变化和今日因素）
    final now = DateTime.now();
    final dayFactor = (now.day % 10) / 10.0; // 基于日期的变化因子
    final monthFactor = (now.month % 12) / 12.0; // 基于月份的变化因子

    final energyData = List.generate(
      5,
      (index) => {
        'name': energyNames[index],
        'value': _calculateEnergyValue(
          normalizedValues,
          index,
          dayFactor,
          monthFactor,
        ),
        'color': energyColors[energyNames[index]]!,
      },
    );

    return {'elements': elementData, 'energies': energyData, 'isReal': true};
  }

  /// 计算运势能量值
  static double _calculateEnergyValue(
    List<double> elementValues,
    int energyIndex,
    double dayFactor,
    double monthFactor,
  ) {
    // 运势与五行的对应关系
    const energyElementMap = {
      0: [3, 2], // 财运主要看金土
      1: [0, 1], // 事业主要看木火
      2: [1, 4], // 感情主要看火水
      3: [2, 0], // 健康主要看土木
      4: [4, 1], // 学业主要看水火
    };

    final relatedElements = energyElementMap[energyIndex]!;
    final baseValue =
        (elementValues[relatedElements[0]] +
            elementValues[relatedElements[1]]) /
        2;

    // 添加今日变化因子
    final todayVariation = (dayFactor + monthFactor) / 2;
    final finalValue = (baseValue * 0.7 + todayVariation * 0.3).clamp(0.0, 1.0);

    return finalValue;
  }

  /// 获取模拟的五行能量数据
  static Map<String, dynamic> _getMockElementEnergy() {
    // 模拟的五行能量值
    const mockElementValues = [0.8, 0.6, 0.9, 0.4, 0.7]; // 木火土金水

    final elementData = List.generate(
      5,
      (index) => {
        'name': elementNames[index],
        'value': mockElementValues[index],
        'color': elementColors[elementNames[index]]!,
      },
    );

    // 模拟的运势能量值
    const mockEnergyValues = [0.75, 0.85, 0.65, 0.90, 0.70]; // 财运、事业、感情、健康、学业

    final energyData = List.generate(
      5,
      (index) => {
        'name': energyNames[index],
        'value': mockEnergyValues[index],
        'color': energyColors[energyNames[index]]!,
      },
    );

    return {'elements': elementData, 'energies': energyData, 'isReal': false};
  }

  /// 获取五行能量的文字描述
  static String getElementEnergyDescription(bool isReal) {
    if (isReal) {
      return '基于您的八字信息计算的今日五行能量分布';
    } else {
      return '模拟数据，请在个人中心设置您的八字信息以获取真实分析';
    }
  }

  /// 获取运势能量的文字描述
  static String getEnergyDescription(bool isReal) {
    if (isReal) {
      return '基于您的八字五行分布计算的今日运势能量';
    } else {
      return '模拟数据，设置八字后可查看真实运势分析';
    }
  }
}
