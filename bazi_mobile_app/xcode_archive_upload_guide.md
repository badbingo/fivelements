# Xcode Archive 构建和上传指南

## 🎯 当前状态
✅ 应用名称已更新为 "Mybazi"
✅ Bundle ID 配置为 "com.mybazi.app"
✅ iOS Release 构建已完成
✅ Xcode 项目已打开

## 📋 Archive 构建步骤

### 1. 配置构建目标
在 Xcode 中：
1. 选择顶部的设备选择器
2. 选择 **"Any iOS Device (arm64)"** 或 **"Generic iOS Device"**
3. 确保选择的是 **Runner** scheme

### 2. 配置代码签名 (重要)
1. 选择 **Runner** 项目
2. 选择 **Runner** target
3. 点击 **"Signing & Capabilities"** 标签页
4. 配置以下设置：
   - ✅ 勾选 **"Automatically manage signing"**
   - 选择您的 **Team** (Apple Developer Account)
   - 确认 **Bundle Identifier** 为 `com.mybazi.app`
   - 确保 **Provisioning Profile** 显示为有效状态

### 3. 创建 Archive
1. 在 Xcode 菜单栏选择：**Product** → **Archive**
2. 等待构建完成（可能需要几分钟）
3. 构建成功后会自动打开 **Organizer** 窗口

### 4. 验证 Archive
在 Organizer 窗口中：
1. 选择刚创建的 Archive
2. 点击 **"Validate App"** 按钮
3. 选择分发方法：**"App Store Connect"**
4. 选择分发选项（保持默认设置）
5. 等待验证完成
6. 如果验证成功，继续下一步

### 5. 上传到 App Store Connect
1. 在 Organizer 中点击 **"Distribute App"** 按钮
2. 选择分发方法：**"App Store Connect"**
3. 选择分发选项：
   - ✅ **"Upload"** (上传)
   - ✅ **"Include bitcode"** (如果可用)
   - ✅ **"Upload your app's symbols"** (上传符号)
4. 选择签名方式：**"Automatically manage signing"**
5. 点击 **"Upload"** 开始上传
6. 等待上传完成（可能需要几分钟到十几分钟）

## 🔧 故障排除

### 常见错误及解决方案

#### 错误 1: 代码签名失败
**症状**: "Code signing error" 或 "Provisioning profile doesn't match"
**解决方案**:
1. 确保 Apple Developer Account 有效
2. 检查 Bundle ID 是否在 Developer Portal 中注册
3. 重新生成 Provisioning Profile
4. 在 Xcode 中重新选择 Team

#### 错误 2: Archive 失败
**症状**: 构建过程中出现编译错误
**解决方案**:
1. 清理项目：**Product** → **Clean Build Folder**
2. 重新运行 `flutter clean && flutter build ios --release --no-codesign`
3. 检查依赖项是否有冲突

#### 错误 3: 上传失败
**症状**: "Upload failed" 或网络错误
**解决方案**:
1. 检查网络连接
2. 确保 Apple ID 有上传权限
3. 稍后重试上传
4. 使用 Application Loader 或 Transporter 应用

### 验证命令
```bash
# 检查代码签名身份
security find-identity -v -p codesigning

# 验证 Archive
codesign -dv --verbose=4 "path/to/Runner.app"

# 检查 Bundle ID
/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" "path/to/Info.plist"
```

## 📱 App Store Connect 后续步骤

### 上传成功后
1. 登录 [App Store Connect](https://appstoreconnect.apple.com/)
2. 进入 **"My Apps"** → 选择您的应用
3. 在 **"App Store"** 标签页中：
   - 填写应用信息
   - 上传截图
   - 设置价格
   - 配置应用描述
4. 在 **"TestFlight"** 标签页中查看构建状态
5. 构建处理完成后，选择构建版本
6. 提交审核

## ⚠️ 重要注意事项

### 首次上传
- 确保应用名称 "Mybazi" 在 App Store 中可用
- 准备好所有必需的截图和元数据
- 确保隐私政策 URL 有效

### 版本管理
- 当前版本：1.0.0 (2)
- 每次上传新构建时，构建号会自动递增
- 版本号只有在发布新版本时才需要更改

### 审核准备
- 确保应用功能完整且稳定
- 准备审核说明（如有特殊功能需要说明）
- 确保符合 App Store 审核指南

## 🚀 快速操作清单

- [ ] 在 Xcode 中选择 "Any iOS Device"
- [ ] 配置代码签名和 Team
- [ ] 创建 Archive (Product → Archive)
- [ ] 验证 Archive
- [ ] 上传到 App Store Connect
- [ ] 在 App Store Connect 中配置应用信息
- [ ] 上传应用截图
- [ ] 提交审核

---

**提示**: 整个流程可能需要 30-60 分钟完成，请耐心等待每个步骤完成。如遇到问题，请参考故障排除部分或联系 Apple Developer Support。