# App Store 发布实操步骤

## 🚀 当前状态
- ✅ Xcode 项目已打开 (`ios/Runner.xcworkspace`)
- ✅ 应用版本：1.0.0+2
- ✅ Bundle ID：com.mybazi.app
- ⚠️ 需要配置分发证书和 Provisioning Profile

---

## 第一步：配置 Apple Developer 账户

### 1.1 登录 Apple Developer Portal
1. 打开浏览器访问：https://developer.apple.com
2. 使用您的 Apple ID 登录
3. 确保您有有效的 Apple Developer Program 会员资格（$99/年）

### 1.2 创建 App ID
1. 进入 "Certificates, Identifiers & Profiles"
2. 选择 "Identifiers" → "App IDs"
3. 点击 "+" 创建新的 App ID
4. 填写信息：
   - **Description**: Mybazi - 八字命理分析应用
   - **Bundle ID**: `com.mybazi.app`
   - **Capabilities**: 保持默认即可
5. 点击 "Continue" 和 "Register"

---

## 第二步：创建分发证书

### 2.1 生成 Certificate Signing Request (CSR)
1. 打开 "钥匙串访问" (Keychain Access)
2. 菜单栏选择 "钥匙串访问" → "证书助理" → "从证书颁发机构请求证书"
3. 填写信息：
   - **用户电子邮件地址**: 您的 Apple ID 邮箱
   - **常用名称**: 您的姓名
   - **CA 电子邮件地址**: 留空
   - 选择 "存储到磁盘"
4. 保存 CSR 文件到桌面

### 2.2 创建分发证书
1. 在 Developer Portal 选择 "Certificates"
2. 点击 "+" 创建新证书
3. 选择 "iOS Distribution (App Store and Ad Hoc)"
4. 上传刚才生成的 CSR 文件
5. 下载证书文件 (.cer)
6. 双击安装到钥匙串

---

## 第三步：创建 Provisioning Profile

### 3.1 创建 App Store Provisioning Profile
1. 在 Developer Portal 选择 "Profiles"
2. 点击 "+" 创建新 Profile
3. 选择 "App Store"
4. 选择刚创建的 App ID (`com.mybazi.app`)
5. 选择分发证书
6. 输入 Profile 名称："Mybazi App Store"
7. 下载 Provisioning Profile (.mobileprovision)
8. 双击安装

---

## 第四步：在 Xcode 中配置签名

### 4.1 配置项目签名
1. 在已打开的 Xcode 中，选择 "Runner" 项目
2. 选择 "Runner" target
3. 点击 "Signing & Capabilities" 标签
4. 配置以下设置：
   - **Automatically manage signing**: 取消勾选
   - **Team**: 选择您的开发者团队
   - **Provisioning Profile**: 选择 "Mybazi App Store"
   - **Signing Certificate**: 选择 "iOS Distribution"

### 4.2 验证配置
确保以下信息正确：
- Bundle Identifier: `com.mybazi.app`
- Version: 1.0.0
- Build: 2

---

## 第五步：构建 Archive

### 5.1 选择设备
1. 在 Xcode 顶部，设备选择器选择 "Any iOS Device (arm64)"

### 5.2 创建 Archive
1. 菜单栏选择 "Product" → "Archive"
2. 等待构建完成（可能需要几分钟）
3. 构建成功后会自动打开 Organizer

### 5.3 验证 Archive
在 Organizer 中确认：
- App 名称：Runner
- Version：1.0.0 (2)
- 没有错误或警告

---

## 第六步：上传到 App Store Connect

### 6.1 分发 Archive
1. 在 Organizer 中选择刚创建的 Archive
2. 点击 "Distribute App"
3. 选择 "App Store Connect"
4. 选择 "Upload"
5. 保持默认选项，点击 "Next"
6. 等待验证完成
7. 点击 "Upload"

### 6.2 等待处理
- 上传完成后，需要等待 Apple 处理（通常 5-30 分钟）
- 您会收到邮件通知处理完成

---

## 第七步：在 App Store Connect 中配置应用

### 7.1 创建应用
1. 访问：https://appstoreconnect.apple.com
2. 选择 "我的 App"
3. 点击 "+" 创建新 App
4. 填写信息：
   - **平台**: iOS
   - **名称**: Mybazi
   - **主要语言**: 简体中文
   - **套装 ID**: com.mybazi.app
   - **SKU**: mybazi-app-001

### 7.2 配置应用信息
参考我们准备的 `app_store_metadata.md` 文件：

#### 基本信息
- **应用名称**: Mybazi
- **副标题**: 专业八字命理分析
- **描述**: 使用准备好的中文描述
- **关键词**: 使用准备好的关键词
- **技术支持网址**: 您的网站或联系方式
- **营销网址**: 可选

#### 分级
- **年龄分级**: 4+
- **内容描述**: 无敏感内容

#### 价格与销售范围
- **价格**: 免费
- **销售范围**: 全球或选择特定国家/地区

---

## 第八步：上传应用截图

### 8.1 制作截图
参考 `app_store_screenshots_guide.md`：

1. 启动 iOS 模拟器：
```bash
flutter run -d "iPhone 15 Pro Max"
```

2. 截取以下页面：
   - 主页面（八字输入）
   - 八字分析结果
   - 命格等级页面
   - 财富分析页面
   - 分享功能展示

3. 截图要求：
   - iPhone 6.7" (1290 x 2796 像素)
   - 至少 3 张，最多 10 张
   - PNG 或 JPEG 格式

### 8.2 上传截图
1. 在 App Store Connect 中选择您的应用
2. 进入 "App Store" 标签
3. 在 "iPhone" 部分上传截图
4. 按顺序排列截图

---

## 第九步：提交审核

### 9.1 最终检查
确认以下信息已完成：
- [ ] 应用信息已填写完整
- [ ] 截图已上传
- [ ] 构建版本已选择
- [ ] 价格和销售范围已设置
- [ ] 年龄分级已完成
- [ ] 隐私政策已提供

### 9.2 提交审核
1. 在 App Store Connect 中点击 "提交以供审核"
2. 回答审核问题（如有）
3. 确认提交

### 9.3 等待审核
- 审核时间：通常 1-7 天
- 您会收到状态更新邮件
- 可在 App Store Connect 中查看审核状态

---

## 常见问题解决

### 签名问题
如果遇到签名错误：
```bash
# 清理项目
flutter clean
rm -rf ios/Pods
rm ios/Podfile.lock
flutter pub get
cd ios && pod install
```

### 构建失败
如果 Archive 失败：
1. 检查证书是否正确安装
2. 确认 Provisioning Profile 匹配
3. 重启 Xcode
4. 清理 Derived Data

### 上传失败
如果上传到 App Store Connect 失败：
1. 检查网络连接
2. 确认 Apple ID 权限
3. 尝试使用 Application Loader

---

## 下一步

完成发布后：
1. **监控审核状态**
2. **准备营销材料**
3. **收集用户反馈**
4. **计划后续更新**

---

## 快速命令参考

```bash
# 检查签名身份
security find-identity -v -p codesigning

# 清理项目
flutter clean && flutter pub get

# 构建 iOS
flutter build ios --release

# 打开 Xcode
open ios/Runner.xcworkspace
```

---

**🎯 目标：成功发布 Mybazi 到 App Store！**

按照以上步骤操作，您的应用很快就能与全球华人用户见面。如有问题，请参考相关文档或联系技术支持。