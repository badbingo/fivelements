import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class TestConnectionPage extends StatefulWidget {
  const TestConnectionPage({super.key});

  @override
  _TestConnectionPageState createState() => _TestConnectionPageState();
}

class _TestConnectionPageState extends State<TestConnectionPage> {
  String _result = '等待测试...';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // 页面加载后自动开始测试
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _testConnection();
    });
  }

  Future<void> _testConnection() async {
    setState(() {
      _isLoading = true;
      _result = '正在测试连接...';
    });

    String testResult = '';
    
    try {
      // 直接测试本地服务器连接
      testResult += '🔗 测试本地服务器连接...\n';
      testResult += '目标地址: https://api.mybazi.net/api/login\n';
    print('🔗 开始测试连接到: https://api.mybazi.net/api/login');
    
    final response = await http.post(
      Uri.parse('https://api.mybazi.net/api/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'username': 'test', 'password': 'test'}),
      ).timeout(Duration(seconds: 10));

      print('📡 响应状态码: ${response.statusCode}');
      print('📡 响应头: ${response.headers}');
      print('📡 响应体: ${response.body}');

      testResult += '✅ 本地服务器连接成功!\n';
      testResult += '状态码: ${response.statusCode}\n';
      testResult += '响应: ${response.body}';
      
      setState(() {
        _result = testResult;
      });
    } catch (e) {
      print('❌ 连接错误: $e');
      testResult += '❌ 连接失败: $e\n\n';
      testResult += '可能的原因:\n';
      testResult += '1. 手机和电脑不在同一WiFi网络\n';
      testResult += '2. 电脑防火墙阻止了连接\n';
      testResult += '3. IP地址不正确\n';
      testResult += '4. 代理服务器未运行\n';
      
      setState(() {
        _result = testResult;
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('网络连接测试'),
        backgroundColor: Colors.blue,
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ElevatedButton(
              onPressed: _isLoading ? null : _testConnection,
              child: _isLoading 
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('测试连接到 api.mybazi.net'),
            ),
            SizedBox(height: 20),
            Expanded(
              child: Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    _result,
                    style: TextStyle(fontFamily: 'monospace'),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}