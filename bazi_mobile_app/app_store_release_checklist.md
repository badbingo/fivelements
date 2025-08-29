# App Store 发布清单 - 正式发布流程

## 🎯 当前状态: 准备开始正式发布

## 应用信息

## 📋 发布前必检项目

### ✅ 已完成项目
- [x] **API配置** - 已切换到生产环境 (https://api.mybazi.net)
- [x] **应用元数据** - 中文描述、关键词、分类已准备完成
- [x] **隐私政策** - 已创建完整的隐私政策文档
- [x] **市场定位** - 确定面向全球华人社区
- [x] **分享功能** - 命格和财富分析分享功能已实现

### ⚠️ 待完成项目（高优先级）

#### 1. 代码签名和证书配置
- [ ] **Apple Developer账户** - 确保有有效的开发者账户
- [ ] **App ID注册** - 在Apple Developer Console注册 `com.mybazi.app`
- [ ] **证书配置** - 配置Distribution Certificate
- [ ] **Provisioning Profile** - 创建App Store发布配置文件
- [ ] **Xcode签名设置** - 在Xcode中配置正确的Team和证书

#### 2. 应用截图制作
- [ ] **iPhone截图** (必需)
  - [ ] 6.7" Display (iPhone 14 Pro Max) - 1290x2796
  - [ ] 6.1" Display (iPhone 14 Pro) - 1179x2556
  - [ ] 5.5" Display (iPhone 8 Plus) - 1242x2208
- [ ] **iPad截图** (可选)
  - [ ] 12.9" Display (iPad Pro) - 2048x2732
  - [ ] 11" Display (iPad Pro) - 1668x2388

**截图内容建议：**
1. 主界面 - 展示应用logo和功能入口
2. 登录界面 - Apple登录功能
3. 输入界面 - 生辰信息输入
4. 命格等级 - 命格评估结果
5. 财富分析 - 财富等级展示
6. 分享功能 - 分析结果分享

#### 3. 最终测试
- [ ] **功能测试**
  - [ ] Apple登录流程
  - [ ] 命格分析生成
  - [ ] 财富分析生成
  - [ ] 分享功能测试
  - [ ] 网络连接测试
- [ ] **性能测试**
  - [ ] 应用启动时间
  - [ ] 内存使用情况
  - [ ] 网络请求响应时间
- [ ] **兼容性测试**
  - [ ] 不同iOS版本测试
  - [ ] 不同设备尺寸测试

#### 4. 版本号更新
- [ ] 更新 `pubspec.yaml` 中的版本号为正式版本
- [ ] 确认Build Number递增

### 🔧 中等优先级项目

#### 5. 应用图标优化
- [ ] **图标规范检查**
  - [ ] 1024x1024 App Store图标
  - [ ] 各种尺寸的应用图标
  - [ ] 图标设计符合Apple规范

#### 6. 分享内容优化
- [ ] 清理分享内容中的特殊符号
- [ ] 修复Markdown渲染问题

## 🚀 发布流程

### 第一步：构建发布版本
```bash
# 清理项目
flutter clean

# 获取依赖
flutter pub get

# 构建iOS发布版本
flutter build ios --release
```

### 第二步：Xcode配置
1. 打开 `ios/Runner.xcworkspace`
2. 选择正确的Team和证书
3. 确认Bundle ID: `com.mybazi.app`
4. 设置版本号和Build号

### 第三步：Archive和上传
1. 在Xcode中选择 "Product" > "Archive"
2. 等待Archive完成
3. 在Organizer中选择 "Distribute App"
4. 选择 "App Store Connect"
5. 上传到App Store Connect

### 第四步：App Store Connect配置
1. 登录 [App Store Connect](https://appstoreconnect.apple.com)
2. 创建新应用
3. 填写应用信息：
   - 应用名称：Mybazi
   - 副标题：专业八字命理分析
   - 描述：使用准备好的中文描述
   - 关键词：使用准备好的关键词
   - 分类：Lifestyle > Entertainment
   - 年龄分级：12+
4. 上传截图
5. 设置价格（免费）
6. 添加隐私政策URL
7. 提交审核

## ⚡ 快速检查命令

```bash
# 检查Flutter环境
flutter doctor

# 检查iOS设备连接
flutter devices

# 运行测试
flutter test

# 分析代码质量
flutter analyze

# 检查依赖
flutter pub deps
```

## 📞 常见问题解决

### 签名问题
- 确保Apple Developer账户有效
- 检查证书是否过期
- 确认Bundle ID唯一且已注册

### 构建失败
- 运行 `flutter clean` 清理缓存
- 检查Xcode版本兼容性
- 确认所有依赖包版本兼容

### 审核被拒
- 检查应用内容是否符合App Store审核指南
- 确保隐私政策完整且可访问
- 验证应用功能正常工作

## 📝 发布后事项

- [ ] 监控应用审核状态
- [ ] 准备营销材料
- [ ] 设置应用分析和崩溃报告
- [ ] 计划后续版本更新

---

**注意：** 首次发布通常需要1-7天的审核时间，请提前规划发布时间。