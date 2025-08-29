import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../models/bazi_model.dart';
import '../../utils/bazi_calculator.dart';

class PersonalBaziScreen extends StatefulWidget {
  const PersonalBaziScreen({super.key});

  @override
  State<PersonalBaziScreen> createState() => _PersonalBaziScreenState();
}

class _PersonalBaziScreenState extends State<PersonalBaziScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _birthDateController = TextEditingController();
  final _birthTimeController = TextEditingController();

  String _selectedGender = 'male';
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadExistingData();

    // 监听AppProvider的变化，当从服务器加载数据后重新填充表单
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<AppProvider>(context, listen: false);
      if (provider.personalBazi != null) {
        _loadExistingData();
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _birthDateController.dispose();
    _birthTimeController.dispose();
    super.dispose();
  }

  void _loadExistingData() {
    final provider = Provider.of<AppProvider>(context, listen: false);
    final personalBazi = provider.personalBazi;

    if (personalBazi != null) {
      setState(() {
        _nameController.text = personalBazi.name;
        _birthDateController.text = personalBazi.birthDate;
        _birthTimeController.text = personalBazi.birthTime;
        _selectedGender = personalBazi.gender;

        // 解析日期
        try {
          final dateParts = personalBazi.birthDate.split('-');
          if (dateParts.length == 3) {
            _selectedDate = DateTime(
              int.parse(dateParts[0]),
              int.parse(dateParts[1]),
              int.parse(dateParts[2]),
            );
          }
        } catch (e) {
          debugPrint('解析日期失败: $e');
        }

        // 解析时间
        try {
          final timeParts = personalBazi.birthTime.split(':');
          if (timeParts.length == 2) {
            _selectedTime = TimeOfDay(
              hour: int.parse(timeParts[0]),
              minute: int.parse(timeParts[1]),
            );
          }
        } catch (e) {
          debugPrint('解析时间失败: $e');
        }
      });

      print('✅ 个人八字信息页面已加载数据: ${personalBazi.name}');
    } else {
      print('⚠️ 个人八字信息页面未找到保存的数据');
    }
  }

  Future<void> _selectDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      locale: const Locale('zh', 'CN'),
    );

    if (date != null) {
      setState(() {
        _selectedDate = date;
        _birthDateController.text =
            '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _selectTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
      builder: (BuildContext context, Widget? child) {
        return Localizations.override(
          context: context,
          locale: const Locale('zh', 'CN'),
          child: child!,
        );
      },
    );

    if (time != null) {
      setState(() {
        _selectedTime = time;
        _birthTimeController.text =
            '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _saveBaziInfo() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedDate == null || _selectedTime == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('请选择完整的出生日期和时间')));
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final provider = Provider.of<AppProvider>(context, listen: false);

      // 使用正确的八字计算算法
      final solarDate = _birthDateController.text;

      // 计算八字
      final baziResult = await BaziCalculator.calculateBazi(
        name: _nameController.text.trim(),
        gender: _selectedGender,
        birthDateTime: DateTime(
          _selectedDate!.year,
          _selectedDate!.month,
          _selectedDate!.day,
          _selectedTime!.hour,
          _selectedTime!.minute,
        ),
      );

      final baziData = BaziModel(
        year: '${baziResult['yearGan']}${baziResult['yearZhi']}',
        month: '${baziResult['monthGan']}${baziResult['monthZhi']}',
        day: '${baziResult['dayGan']}${baziResult['dayZhi']}',
        hour: '${baziResult['hourGan']}${baziResult['hourZhi']}',
        yearGan: baziResult['yearGan'] ?? '',
        yearZhi: baziResult['yearZhi'] ?? '',
        monthGan: baziResult['monthGan'] ?? '',
        monthZhi: baziResult['monthZhi'] ?? '',
        dayGan: baziResult['dayGan'] ?? '',
        dayZhi: baziResult['dayZhi'] ?? '',
        hourGan: baziResult['hourGan'] ?? '',
        hourZhi: baziResult['hourZhi'] ?? '',
        gender: _selectedGender,
        solarDate: baziResult['solarDate'] ?? solarDate,
        lunarDate: baziResult['lunarDate'] ?? '农历待计算',
      );

      final personalBazi = PersonalBaziInfo(
        name: _nameController.text.trim(),
        birthDate: _birthDateController.text,
        birthTime: _birthTimeController.text,
        gender: _selectedGender,
        solarDate: baziResult['solarDate'] ?? solarDate,
        lunarDate: baziResult['lunarDate'] ?? '农历待计算',
        baziData: baziData,
        createdAt: provider.personalBazi?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await provider.setPersonalBazi(personalBazi);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('个人八字信息保存成功'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('保存失败: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Widget _buildBaziPillar(String title, String value) {
    return Column(
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFFFFD700),
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: const Color(0xFFFFD700).withOpacity(0.5),
              width: 1,
            ),
          ),
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              fontFamily: 'serif',
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text(
              '我的八字',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            backgroundColor: const Color(0xFF8B4513),
            elevation: 0,
            iconTheme: const IconThemeData(color: Colors.white),
            actions: [
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                  ),
                )
              else
                Container(
                  margin: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
                  child: ElevatedButton(
                    onPressed: _saveBaziInfo,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD4AF37),
                      foregroundColor: Colors.white,
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                    ),
                    child: const Text(
                      '保存',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF8B4513), Color(0xFFF5E6D3)],
                stops: [0.0, 0.3],
              ),
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 八字信息卡片 - 移到顶部
                    Consumer<AppProvider>(
                      builder: (context, provider, child) {
                        if (provider.personalBazi != null &&
                            provider.personalBazi!.baziData != null) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 24),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF1A237E), Color(0xFF3949AB)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(
                                    0xFF1A237E,
                                  ).withOpacity(0.3),
                                  blurRadius: 15,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(24),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFFD700),
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(
                                                0xFFFFD700,
                                              ).withOpacity(0.3),
                                              blurRadius: 8,
                                              offset: const Offset(0, 4),
                                            ),
                                          ],
                                        ),
                                        child: const Icon(
                                          Icons.auto_awesome,
                                          color: Color(0xFF1A237E),
                                          size: 28,
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            const Text(
                                              '我的八字',
                                              style: TextStyle(
                                                fontSize: 22,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.white,
                                              ),
                                            ),
                                            Text(
                                              provider.personalBazi!.name,
                                              style: const TextStyle(
                                                fontSize: 16,
                                                color: Color(0xFFFFD700),
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 20),
                                  Container(
                                    padding: const EdgeInsets.all(20),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: const Color(
                                          0xFFFFD700,
                                        ).withOpacity(0.3),
                                        width: 1,
                                      ),
                                    ),
                                    child: Column(
                                      children: [
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceAround,
                                          children: [
                                            _buildBaziPillar(
                                              '年柱',
                                              provider
                                                  .personalBazi!
                                                  .baziData!
                                                  .year,
                                            ),
                                            _buildBaziPillar(
                                              '月柱',
                                              provider
                                                  .personalBazi!
                                                  .baziData!
                                                  .month,
                                            ),
                                            _buildBaziPillar(
                                              '日柱',
                                              provider
                                                  .personalBazi!
                                                  .baziData!
                                                  .day,
                                            ),
                                            _buildBaziPillar(
                                              '时柱',
                                              provider
                                                  .personalBazi!
                                                  .baziData!
                                                  .hour,
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 16),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 16,
                                            vertical: 12,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(
                                              0xFFFFD700,
                                            ).withOpacity(0.2),
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                          ),
                                          child: Row(
                                            children: [
                                              const Icon(
                                                Icons.calendar_month,
                                                color: Color(0xFFFFD700),
                                                size: 18,
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                '农历: ${provider.personalBazi!.lunarDate ?? '未计算'}',
                                                style: const TextStyle(
                                                  fontSize: 14,
                                                  color: Color(0xFFFFD700),
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),

                    // 说明文字
                    Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFD4AF37), Color(0xFFFFE55C)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(
                                    Icons.edit_note,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Text(
                                  '编辑个人信息',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              '请准确填写您的个人信息，这将用于生成专属的八字排盘。信息仅保存在本地，与您的账户绑定。',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // 姓名输入
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextFormField(
                        controller: _nameController,
                        decoration: InputDecoration(
                          labelText: '姓名',
                          hintText: '请输入您的姓名',
                          prefixIcon: const Icon(
                            Icons.person,
                            color: Color(0xFF8B4513),
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          labelStyle: const TextStyle(color: Color(0xFF8B4513)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Color(0xFFD4AF37),
                              width: 2,
                            ),
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return '请输入姓名';
                          }
                          return null;
                        },
                      ),
                    ),

                    const SizedBox(height: 16),

                    // 性别选择
                    const Text(
                      '性别',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF8B4513),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Container(
                              margin: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: _selectedGender == 'male'
                                    ? const Color(0xFFD4AF37)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: RadioListTile<String>(
                                title: Text(
                                  '男',
                                  style: TextStyle(
                                    color: _selectedGender == 'male'
                                        ? Colors.white
                                        : const Color(0xFF8B4513),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                value: 'male',
                                groupValue: _selectedGender,
                                activeColor: Colors.white,
                                onChanged: (value) {
                                  setState(() {
                                    _selectedGender = value!;
                                  });
                                },
                              ),
                            ),
                          ),
                          Expanded(
                            child: Container(
                              margin: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: _selectedGender == 'female'
                                    ? const Color(0xFFD4AF37)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: RadioListTile<String>(
                                title: Text(
                                  '女',
                                  style: TextStyle(
                                    color: _selectedGender == 'female'
                                        ? Colors.white
                                        : const Color(0xFF8B4513),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                value: 'female',
                                groupValue: _selectedGender,
                                activeColor: Colors.white,
                                onChanged: (value) {
                                  setState(() {
                                    _selectedGender = value!;
                                  });
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // 出生日期
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextFormField(
                        controller: _birthDateController,
                        decoration: InputDecoration(
                          labelText: '出生日期',
                          hintText: '请选择出生日期',
                          prefixIcon: const Icon(
                            Icons.calendar_today,
                            color: Color(0xFF8B4513),
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          labelStyle: const TextStyle(color: Color(0xFF8B4513)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Color(0xFFD4AF37),
                              width: 2,
                            ),
                          ),
                        ),
                        readOnly: true,
                        onTap: _selectDate,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return '请选择出生日期';
                          }
                          return null;
                        },
                      ),
                    ),

                    const SizedBox(height: 16),

                    // 出生时间
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextFormField(
                        controller: _birthTimeController,
                        decoration: InputDecoration(
                          labelText: '出生时间',
                          hintText: '请选择出生时间',
                          prefixIcon: const Icon(
                            Icons.access_time,
                            color: Color(0xFF8B4513),
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: Colors.white,
                          labelStyle: const TextStyle(color: Color(0xFF8B4513)),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Color(0xFFD4AF37),
                              width: 2,
                            ),
                          ),
                        ),
                        readOnly: true,
                        onTap: _selectTime,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return '请选择出生时间';
                          }
                          return null;
                        },
                      ),
                    ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
