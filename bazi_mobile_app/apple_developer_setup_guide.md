# Apple Developer 账户配置指南

## 🎯 当前任务: 配置 App Store 发布所需的证书和配置文件

### 📋 应用信息
- **Bundle ID**: `com.mybazi.app`
- **应用名称**: Mybazi
- **平台**: iOS
- **分发方式**: App Store

## 🔧 配置步骤

### 1. 登录 Apple Developer Portal
✅ **已完成**: Apple Developer Portal 已打开
- 网址: https://developer.apple.com/account/
- 请使用您的 Apple ID 登录

### 2. 创建 App ID

#### 步骤:
1. 在 Developer Portal 中，导航到 **Certificates, Identifiers & Profiles**
2. 点击 **Identifiers** → **App IDs**
3. 点击 **+** 按钮创建新的 App ID
4. 选择 **App** 类型
5. 填写以下信息:
   - **Description**: `Mybazi - 八字命理分析应用`
   - **Bundle ID**: `com.mybazi.app` (Explicit)
   - **Capabilities**: 根据需要选择以下功能:
     - [x] App Groups (如果使用)
     - [x] Associated Domains (如果有深度链接)
     - [x] Push Notifications (如果需要推送)
     - [x] Sign In with Apple (如果使用)

### 3. 生成分发证书 (Distribution Certificate)

#### 步骤:
1. 在 **Certificates** 部分，点击 **+** 按钮
2. 选择 **iOS Distribution (App Store and Ad Hoc)**
3. 按照指示创建 Certificate Signing Request (CSR):
   ```bash
   # 在 macOS 上打开 Keychain Access
   # Certificate Assistant → Request a Certificate From a Certificate Authority
   # 填写邮箱地址，选择 "Saved to disk"
   ```
4. 上传生成的 CSR 文件
5. 下载并安装分发证书

### 4. 创建 Provisioning Profile

#### 步骤:
1. 在 **Profiles** 部分，点击 **+** 按钮
2. 选择 **App Store** 分发类型
3. 选择刚创建的 App ID (`com.mybazi.app`)
4. 选择分发证书
5. 命名 Profile: `Mybazi App Store Distribution`
6. 下载 Provisioning Profile

### 5. 在 Xcode 中配置签名

#### 自动签名 (推荐):
1. 在 Xcode 中打开项目
2. 选择 **Runner** target
3. 在 **Signing & Capabilities** 标签页:
   - 勾选 **Automatically manage signing**
   - 选择正确的 **Team**
   - 确认 **Bundle Identifier** 为 `com.mybazi.app`

#### 手动签名:
1. 取消勾选 **Automatically manage signing**
2. 为 **Release** 配置选择:
   - **Provisioning Profile**: 刚创建的 App Store Profile
   - **Signing Certificate**: iOS Distribution 证书

## 🚀 验证配置

### 检查命令
```bash
# 检查已安装的证书
security find-identity -v -p codesigning

# 检查 Provisioning Profiles
ls ~/Library/MobileDevice/Provisioning\ Profiles/

# 验证项目配置
xcodebuild -showBuildSettings -workspace ios/Runner.xcworkspace -scheme Runner -configuration Release | grep -E "CODE_SIGN|PROVISIONING"
```

### 预期输出
- 应该看到 iOS Distribution 证书
- 应该有对应的 Provisioning Profile
- Bundle ID 应该匹配 `com.mybazi.app`

## 📱 App Store Connect 准备

### 创建应用记录
1. 访问 [App Store Connect](https://appstoreconnect.apple.com/)
2. 点击 **My Apps** → **+** → **New App**
3. 填写应用信息:
   - **Platform**: iOS
   - **Name**: `Mybazi`
   - **Primary Language**: 简体中文
   - **Bundle ID**: 选择 `com.mybazi.app`
   - **SKU**: `mybazi-ios-app-2024`

## ⚠️ 常见问题

### 问题 1: 证书冲突
**解决方案**: 删除旧的开发证书，重新生成分发证书

### 问题 2: Bundle ID 已存在
**解决方案**: 检查是否已经创建过，或使用不同的 Bundle ID

### 问题 3: Provisioning Profile 不匹配
**解决方案**: 确保 Profile 包含正确的 App ID 和证书

## ✅ 完成检查清单

- [ ] Apple Developer Portal 登录成功
- [ ] App ID 创建完成 (`com.mybazi.app`)
- [ ] iOS Distribution 证书生成并安装
- [ ] App Store Provisioning Profile 创建并下载
- [ ] Xcode 项目签名配置完成
- [ ] App Store Connect 应用记录创建
- [ ] 配置验证通过

## 🔄 下一步

完成上述配置后，您就可以:
1. 构建 Release Archive
2. 上传到 App Store Connect
3. 配置应用元数据和截图
4. 提交审核

---

**重要提示**: 确保所有步骤都正确完成，任何配置错误都可能导致构建或上传失败。