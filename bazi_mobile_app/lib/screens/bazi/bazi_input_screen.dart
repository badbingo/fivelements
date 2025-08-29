import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/bazi_models.dart';
import '../../models/bazi_model.dart';
import '../../services/bazi_api_service.dart';
import '../../services/auth_service.dart';
import 'bazi_result_screen.dart';
import '../../providers/app_provider.dart' as provider;

/// 八字输入页面
class BaziInputScreen extends StatefulWidget {
  const BaziInputScreen({super.key});

  @override
  State<BaziInputScreen> createState() => _BaziInputScreenState();
}

class _BaziInputScreenState extends State<BaziInputScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();

  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = TimeOfDay.now();
  String _selectedGender = '男';
  String _selectedCalendar = '公历';
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('八字排盘'),
        backgroundColor: Colors.orange.shade600,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 说明卡片
                _buildInfoCard(),

                const SizedBox(height: 24),

                // 输入表单
                _buildInputForm(),

                const SizedBox(height: 32),

                // 计算按钮
                _buildCalculateButton(),

                const SizedBox(height: 32),

                // 最新排盘记录
                _buildRecentRecords(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: Colors.blue.shade600, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              '请准确填写出生信息，时间精确到分钟可提高排盘准确性',
              style: TextStyle(color: Colors.blue.shade700, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputForm() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade200,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 姓名输入
          _buildNameInput(),

          const SizedBox(height: 20),

          // 性别选择
          _buildGenderSelector(),

          const SizedBox(height: 20),

          // 历法选择
          _buildCalendarSelector(),

          const SizedBox(height: 20),

          // 出生日期
          _buildDatePicker(),

          const SizedBox(height: 20),

          // 出生时间
          _buildTimePicker(),
        ],
      ),
    );
  }

  Widget _buildNameInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '姓名',
          style: TextStyle(fontWeight: FontWeight.w500, fontSize: 16),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _nameController,
          decoration: InputDecoration(
            hintText: '请输入姓名',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.orange.shade400),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
          ),
          validator: (value) {
            if (value == null || value.trim().isEmpty) {
              return '请输入姓名';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildGenderSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '性别',
          style: TextStyle(fontWeight: FontWeight.w500, fontSize: 16),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _buildGenderOption('男')),
            const SizedBox(width: 12),
            Expanded(child: _buildGenderOption('女')),
          ],
        ),
      ],
    );
  }

  Widget _buildGenderOption(String gender) {
    final isSelected = _selectedGender == gender;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedGender = gender;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.orange.shade50 : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? Colors.orange.shade400 : Colors.grey.shade300,
          ),
        ),
        child: Center(
          child: Text(
            gender,
            style: TextStyle(
              color: isSelected ? Colors.orange.shade600 : Colors.grey.shade600,
              fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCalendarSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '历法',
          style: TextStyle(fontWeight: FontWeight.w500, fontSize: 16),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(child: _buildCalendarOption('公历')),
            const SizedBox(width: 12),
            Expanded(child: _buildCalendarOption('农历')),
          ],
        ),
      ],
    );
  }

  Widget _buildCalendarOption(String calendar) {
    final isSelected = _selectedCalendar == calendar;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCalendar = calendar;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue.shade50 : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? Colors.blue.shade400 : Colors.grey.shade300,
          ),
        ),
        child: Center(
          child: Text(
            calendar,
            style: TextStyle(
              color: isSelected ? Colors.blue.shade600 : Colors.grey.shade600,
              fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDatePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '出生日期',
          style: TextStyle(fontWeight: FontWeight.w500, fontSize: 16),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _showDatePicker,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  color: Colors.grey.shade600,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '${_selectedDate.year}年${_selectedDate.month}月${_selectedDate.day}日',
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
                Icon(Icons.arrow_drop_down, color: Colors.grey.shade600),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTimePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          '出生时间',
          style: TextStyle(fontWeight: FontWeight.w500, fontSize: 16),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _showTimePicker,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.access_time, color: Colors.grey.shade600, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}',
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
                Icon(Icons.arrow_drop_down, color: Colors.grey.shade600),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCalculateButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _calculateBazi,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.orange.shade600,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
        ),
        child: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : const Text(
                '开始排盘',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
      ),
    );
  }

  void _showDatePicker() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      locale: const Locale('zh', 'CN'),
    );

    if (date != null) {
      setState(() {
        _selectedDate = date;
      });
    }
  }

  void _showTimePicker() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
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
      });
    }
  }

  void _calculateBazi() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final authService = Provider.of<AuthService>(context, listen: false);
      final apiService = BaziApiService();

      // 构建输入数据
      final birthDateTime = DateTime(
        _selectedDate.year,
        _selectedDate.month,
        _selectedDate.day,
        _selectedTime.hour,
        _selectedTime.minute,
      );

      final input = BaziInput(
        name: _nameController.text.trim(),
        birthDate: birthDateTime,
        birthTime:
            '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}',
        gender: _selectedGender,
        isLunar: _selectedCalendar == '农历',
      );

      // 调用API计算八字
      final result = await apiService.calculateBazi(input);

      // 添加到最近记录
      final appProvider = Provider.of<provider.AppProvider>(
        context,
        listen: false,
      );
      appProvider.addLocalRecentRecord(
        _nameController.text.trim(),
        _selectedGender,
        '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
        '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}',
        type: 'bazi',
        title: '${_nameController.text.trim()}的八字测算',
        summary: '八字排盘及分析',
        cost: 0.0,
      );

      // 保存个人八字信息到数据库
      final now = DateTime.now();
      final baziModel = BaziModel(
        year: result.paipan.yearPillar,
        month: result.paipan.monthPillar,
        day: result.paipan.dayPillar,
        hour: result.paipan.hourPillar,
        yearGan: result.paipan.yearPillar.isNotEmpty
            ? result.paipan.yearPillar[0]
            : '',
        yearZhi: result.paipan.yearPillar.length > 1
            ? result.paipan.yearPillar[1]
            : '',
        monthGan: result.paipan.monthPillar.isNotEmpty
            ? result.paipan.monthPillar[0]
            : '',
        monthZhi: result.paipan.monthPillar.length > 1
            ? result.paipan.monthPillar[1]
            : '',
        dayGan: result.paipan.dayPillar.isNotEmpty
            ? result.paipan.dayPillar[0]
            : '',
        dayZhi: result.paipan.dayPillar.length > 1
            ? result.paipan.dayPillar[1]
            : '',
        hourGan: result.paipan.hourPillar.isNotEmpty
            ? result.paipan.hourPillar[0]
            : '',
        hourZhi: result.paipan.hourPillar.length > 1
            ? result.paipan.hourPillar[1]
            : '',
        gender: _selectedGender,
        solarDate:
            '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
        lunarDate: _selectedCalendar == '农历'
            ? '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}'
            : '',
      );

      final personalBazi = PersonalBaziInfo(
        name: _nameController.text.trim(),
        gender: _selectedGender,
        birthDate:
            '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}',
        birthTime:
            '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}',
        lunarDate: _selectedCalendar == '农历'
            ? '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}'
            : '',
        baziData: baziModel,
        createdAt: now,
        updatedAt: now,
      );

      // 注释掉数据库保存，仅保存到本地记录
      // await appProvider.setPersonalBazi(personalBazi);
      print('✅ 八字信息仅保存在本地记录中');

      if (mounted) {
        // 导航到结果页面 - 暂时显示成功消息
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('八字计算成功！'),
            backgroundColor: Colors.green,
          ),
        );

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                BaziResultScreen(input: input, result: result),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('计算失败：${e.toString()}'),
            backgroundColor: Colors.red,
          ),
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

  Widget _buildRecentRecords() {
    return Consumer<provider.AppProvider>(
      builder: (context, appProvider, child) {
        final records = appProvider.recentRecords.take(10).toList();

        if (records.isEmpty) {
          return const SizedBox.shrink();
        }

        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.shade200,
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.history, color: Colors.orange.shade600, size: 20),
                  const SizedBox(width: 8),
                  const Text(
                    '最新排盘记录',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                  ),
                  const Spacer(),
                  Text(
                    '点击直接进入',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ...records.map((record) => _buildRecordItem(record)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRecordItem(provider.BaziRecord record) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: record.gender == '男'
                  ? Colors.blue.shade100
                  : Colors.pink.shade100,
              child: Icon(
                record.gender == '男' ? Icons.male : Icons.female,
                size: 16,
                color: record.gender == '男'
                    ? Colors.blue.shade600
                    : Colors.pink.shade600,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: InkWell(
                onTap: () => _loadRecord(record),
                borderRadius: BorderRadius.circular(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      record.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${record.birthDate} ${record.birthTime}',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Text(
              _formatTime(record.createdAt),
              style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: () => _loadRecord(record),
              borderRadius: BorderRadius.circular(4),
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: Icon(
                  Icons.arrow_forward_ios,
                  size: 12,
                  color: Colors.grey.shade400,
                ),
              ),
            ),
            const SizedBox(width: 4),
            InkWell(
              onTap: () => _deleteRecord(record),
              borderRadius: BorderRadius.circular(4),
              child: Padding(
                padding: const EdgeInsets.all(4),
                child: Icon(
                  Icons.delete_outline,
                  size: 16,
                  color: Colors.red.shade400,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return '刚刚';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}分钟前';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}小时前';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}天前';
    } else {
      return '${dateTime.month}/${dateTime.day}';
    }
  }

  void _loadRecord(provider.BaziRecord record) async {
    // 填充表单数据
    _nameController.text = record.name;
    _selectedGender = record.gender;

    // 解析日期
    final dateParts = record.birthDate.split('-');
    if (dateParts.length == 3) {
      _selectedDate = DateTime(
        int.parse(dateParts[0]),
        int.parse(dateParts[1]),
        int.parse(dateParts[2]),
      );
    }

    // 解析时间
    final timeParts = record.birthTime.split(':');
    if (timeParts.length == 2) {
      _selectedTime = TimeOfDay(
        hour: int.parse(timeParts[0]),
        minute: int.parse(timeParts[1]),
      );
    }

    setState(() {});

    // 自动计算八字
    _calculateBazi();
  }

  void _deleteRecord(provider.BaziRecord record) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('删除记录'),
          content: Text('确定要删除 ${record.name} 的排盘记录吗？'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
            TextButton(
              onPressed: () {
                final appProvider = Provider.of<provider.AppProvider>(
                  context,
                  listen: false,
                );
                appProvider.removeRecentRecord(record.id);
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('记录已删除'),
                    backgroundColor: Colors.green,
                  ),
                );
              },
              child: const Text('删除', style: TextStyle(color: Colors.red)),
            ),
          ],
        );
      },
    );
  }
}
