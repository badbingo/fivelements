# iOS 代码签名配置指南

## 前置要求

### 1. Apple Developer Account
- 确保拥有有效的 Apple Developer Program 账户
- 年费：$99 USD
- 登录：https://developer.apple.com

### 2. Xcode 配置
- 确保 Xcode 已安装最新版本
- 当前项目使用 Xcode 16.4

## 配置步骤

### 1. 在 Apple Developer Portal 创建 App ID

1. 登录 https://developer.apple.com
2. 进入 "Certificates, Identifiers & Profiles"
3. 选择 "Identifiers" > "App IDs"
4. 点击 "+" 创建新的 App ID
5. 配置信息：
   - **Description**: Mybazi - 八字命理分析应用
   - **Bundle ID**: `com.mybazi.app` (已在项目中配置)
   - **Capabilities**: 根据需要选择（基础应用无需特殊权限）

### 2. 创建分发证书

1. 在 Developer Portal 选择 "Certificates"
2. 点击 "+" 创建新证书
3. 选择 "iOS Distribution (App Store and Ad Hoc)"
4. 上传 Certificate Signing Request (CSR)
5. 下载并安装证书到 Keychain

### 3. 创建 Provisioning Profile

1. 在 Developer Portal 选择 "Profiles"
2. 点击 "+" 创建新 Profile
3. 选择 "App Store"
4. 选择之前创建的 App ID
5. 选择分发证书
6. 下载 Provisioning Profile

### 4. 在 Xcode 中配置签名

1. 打开项目：
```bash
open ios/Runner.xcworkspace
```

2. 选择 Runner 项目
3. 在 "Signing & Capabilities" 标签页：
   - **Team**: 选择你的开发者团队
   - **Bundle Identifier**: 确认为 `com.mybazi.app`
   - **Provisioning Profile**: 选择刚创建的 App Store profile
   - **Signing Certificate**: 选择分发证书

### 5. 配置 Release 构建

在 `ios/Runner.xcodeproj/project.pbxproj` 中确认以下配置：

```
CODE_SIGN_IDENTITY = "iPhone Distribution";
CODE_SIGN_STYLE = Manual;
DEVELOPMENT_TEAM = "你的团队ID";
PRODUCT_BUNDLE_IDENTIFIER = "com.mybazi.app";
PROVISIONING_PROFILE_SPECIFIER = "你的Profile名称";
```

## 构建和上传

### 1. 构建 Archive

```bash
# 清理之前的构建
flutter clean
flutter pub get

# 构建 iOS Archive
flutter build ipa --release
```

### 2. 使用 Xcode 上传

1. 打开 Xcode
2. Window > Organizer
3. 选择 Archives 标签
4. 找到刚构建的 archive
5. 点击 "Distribute App"
6. 选择 "App Store Connect"
7. 按提示完成上传

### 3. 使用命令行上传（可选）

```bash
# 使用 xcrun altool 上传
xcrun altool --upload-app --type ios --file "build/ios/ipa/bazi_mobile_app.ipa" --username "你的Apple ID" --password "应用专用密码"
```

## 常见问题解决

### 1. 证书问题

**错误**: "No signing certificate found"

**解决**:
- 确保证书已正确安装到 Keychain
- 检查证书是否过期
- 重新下载并安装证书

### 2. Provisioning Profile 问题

**错误**: "No provisioning profiles found"

**解决**:
- 确保 Bundle ID 匹配
- 检查 Profile 是否包含正确的证书
- 重新创建 Provisioning Profile

### 3. 构建失败

**错误**: "Code signing failed"

**解决**:
```bash
# 清理 Xcode 缓存
rm -rf ~/Library/Developer/Xcode/DerivedData

# 重新构建
flutter clean
flutter pub get
flutter build ios --release
```

## 验证配置

### 1. 检查当前配置

```bash
# 检查 Bundle ID
grep -r "PRODUCT_BUNDLE_IDENTIFIER" ios/

# 检查签名设置
grep -r "CODE_SIGN" ios/Runner.xcodeproj/project.pbxproj
```

### 2. 测试构建

```bash
# 测试 Release 构建
flutter build ios --release --no-codesign

# 如果成功，再尝试带签名的构建
flutter build ipa --release
```

## 发布检查清单

- [ ] Apple Developer Account 有效
- [ ] App ID 已创建 (`com.mybazi.app`)
- [ ] 分发证书已创建并安装
- [ ] App Store Provisioning Profile 已创建
- [ ] Xcode 签名配置正确
- [ ] 应用版本号已更新
- [ ] 构建成功无错误
- [ ] Archive 已上传到 App Store Connect

## 下一步

完成代码签名配置后：
1. 在 App Store Connect 中配置应用信息
2. 上传应用截图
3. 填写应用描述和关键词
4. 提交审核

## 有用的命令

```bash
# 查看可用的签名身份
security find-identity -v -p codesigning

# 查看 Provisioning Profiles
ls ~/Library/MobileDevice/Provisioning\ Profiles/

# 验证 IPA 文件
codesign -dv --verbose=4 build/ios/ipa/bazi_mobile_app.ipa
```