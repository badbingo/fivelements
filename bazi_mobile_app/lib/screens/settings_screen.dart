import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/app_provider.dart';
import 'settings/cache_management_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String selectedZodiac = 'dragon'; // 默认选择龙
  final TextEditingController _usernameController = TextEditingController();

  final List<Map<String, String>> zodiacList = [
    {'name': '鼠', 'file': 'rat'},
    {'name': '牛', 'file': 'ox'},
    {'name': '虎', 'file': 'tiger'},
    {'name': '兔', 'file': 'rabbit'},
    {'name': '龙', 'file': 'dragon'},
    {'name': '蛇', 'file': 'snake'},
    {'name': '马', 'file': 'horse'},
    {'name': '羊', 'file': 'goat'},
    {'name': '猴', 'file': 'monkey'},
    {'name': '鸡', 'file': 'rooster'},
    {'name': '狗', 'file': 'dog'},
    {'name': '猪', 'file': 'pig'},
  ];

  @override
  void initState() {
    super.initState();
    _loadSelectedZodiac();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    super.dispose();
  }

  Future<void> _loadSelectedZodiac() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      selectedZodiac = prefs.getString('selected_zodiac') ?? 'dragon';
    });
  }

  Future<void> _saveSelectedZodiac(String zodiac) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selected_zodiac', zodiac);
    setState(() {
      selectedZodiac = zodiac;
    });
  }

  Future<void> _confirmReplaceAvatar() async {
    print('🔄 设置页面保存头像: $selectedZodiac');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selected_zodiac', selectedZodiac);
    print('💾 头像已保存到SharedPreferences');
    
    // 通过Provider更新全局状态（包含本地保存和服务器同步）
    if (mounted) {
      final provider = Provider.of<AppProvider>(context, listen: false);
      try {
        await provider.updateSelectedZodiac(selectedZodiac);
        print('✅ 头像已更新并同步到服务器');
      } catch (e) {
        print('❌ 头像更新失败: $e');
        // 即使同步失败也不影响本地保存
      }
      
      // 显示保存成功提示
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('头像已更新'),
          duration: Duration(seconds: 1),
        ),
      );
      
      // 延迟一下再跳转，让用户看到提示
      await Future.delayed(const Duration(milliseconds: 500));
      
      // 返回到个人中心页面，并传递刷新标志
      Navigator.pop(context, true); // 传递true表示需要刷新
    }
  }

  Future<void> _updateUsername() async {
    final newUsername = _usernameController.text.trim();
    
    if (newUsername.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('请输入新的用户名'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    if (newUsername.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('用户名至少需要2个字符'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    final provider = Provider.of<AppProvider>(context, listen: false);
    
    try {
      final success = await provider.updateUsername(newUsername);
      
      if (success) {
        _usernameController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('用户名更新成功'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('用户名更新失败，可能已被使用'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('更新失败: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        return Scaffold(
          backgroundColor: Colors.grey[50],
          appBar: AppBar(
            title: const Text(
              '设置',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            backgroundColor: const Color(0xFF667eea),
            elevation: 0,
            iconTheme: const IconThemeData(color: Colors.white),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 头像设置区域
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      const Text(
                        '选择生肖头像',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 16),
                      // 当前头像预览
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(40),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 15,
                              offset: const Offset(0, 5),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(40),
                          child: SvgPicture.asset(
                            'assets/zodiac/$selectedZodiac.svg',
                            width: 80,
                            height: 80,
                            fit: BoxFit.cover,
                            placeholderBuilder: (context) => Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: Colors.orange.shade300,
                                borderRadius: BorderRadius.circular(40),
                              ),
                              child: const Center(
                                child: Icon(
                                  Icons.person,
                                  size: 40,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        zodiacList.firstWhere((z) => z['file'] == selectedZodiac)['name'] ?? '龙',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 20),
                      // 生肖网格
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 1,
                        ),
                        itemCount: zodiacList.length,
                        itemBuilder: (context, index) {
                          final zodiac = zodiacList[index];
                          final isSelected = selectedZodiac == zodiac['file'];
                          
                          return GestureDetector(
                            onTap: () => setState(() {
                              selectedZodiac = zodiac['file']!;
                            }),
                            child: Container(
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFF667eea).withOpacity(0.1) : Colors.grey[50],
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? const Color(0xFF667eea) : Colors.grey[300]!,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: isSelected ? [
                                        BoxShadow(
                                          color: const Color(0xFF667eea).withOpacity(0.3),
                                          blurRadius: 8,
                                          offset: const Offset(0, 3),
                                        ),
                                      ] : null,
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(20),
                                      child: SvgPicture.asset(
                                        'assets/zodiac/${zodiac['file']}.svg',
                                        width: 40,
                                        height: 40,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    zodiac['name']!,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      color: isSelected ? const Color(0xFF667eea) : Colors.black54,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 20),
                      // 确认替换按钮
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _confirmReplaceAvatar,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF667eea),
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            '确认替换',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 30),
                
                // 用户名设置区域
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '修改用户名',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        '当前用户名: ${provider.user?.username ?? '未知'}',
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _usernameController,
                        decoration: InputDecoration(
                          labelText: '新用户名',
                          hintText: '请输入新的用户名',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: const BorderSide(
                              color: Color(0xFF667eea),
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _updateUsername,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF667eea),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            '更新用户名',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 30),
                
                // 缓存管理区域
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '缓存管理',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        '管理应用缓存，节省存储空间',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const CacheManagementScreen(),
                              ),
                            );
                          },
                          icon: const Icon(Icons.storage),
                          label: const Text('缓存管理'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF667eea),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

}