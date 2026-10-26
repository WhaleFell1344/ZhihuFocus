# Safari 自用版（Mac / iPad）

复用现有知乎、豆瓣的页面样式、深浅色主题、阅读设置和标签页私信数清理，不单独重做手机版页面。

- Mac：macOS 14 或更新版本。
- iPad：iPadOS 17 或更新版本；优先使用 Safari 的桌面网站视图。
- 工程由 Xcode 27 的官方 Safari Web Extension Packager 生成，同时包含 macOS 和 iOS 的宿主 App 与扩展。
- 真机安装按已有的付费 Apple Developer 账号准备，不需要上架 App Store 或使用 TestFlight。

## 安装

打开 `safari/ZhihuFocus/ZhihuFocus.xcodeproj`。

### 签名

在 Xcode 的 Signing & Capabilities 中，为 App 和 Extension 选择同一个开发团队，保留 Automatically manage signing。

也可以创建 `safari/Signing.local.xcconfig`：

```xcconfig
DEVELOPMENT_TEAM = 你的十位TeamID
```

这个文件已被 Git 忽略，账号、证书和描述文件不会加入仓库。如果更改 Bundle Identifier，需要同步修改共享 `ViewController.swift` 中的 `extensionBundleIdentifier`；扩展标识应为 App 标识加 `.Extension`。

### Mac

1. 选择 `ZhihuFocus (macOS)` scheme 和 `My Mac`，点击 Run。
2. 在打开的 App 中点击“打开 Safari 设置并退出”。
3. 在 Safari 的“设置 → 扩展”中开启 ZhihuFocus，允许访问知乎和豆瓣，然后刷新网页。

仅编译但未签名的检查产物不能视为完成安装。本工程优先使用开发证书签名；未签名调试需要 Safari 的“允许未签名扩展”选项，该选项会在退出 Safari 后复位。[Apple 安装说明](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension)

### iPad

1. 连接自己的 iPad，在 Xcode 中选择 `ZhihuFocus (iOS)` scheme 和该设备，点击 Run。首次调试如有信任电脑或开发者模式提示，在设备上完成。
2. 在 iPad 的系统设置中搜索 Safari，进入“扩展”，开启 ZhihuFocus，并允许访问知乎和豆瓣。
3. 打开知乎或豆瓣并刷新。若显示手机版页面，在 Safari 页面菜单中选择“请求桌面网站”。

需要在 iPad 上安装包含扩展的 App，不能把 Chrome 扩展文件夹直接导入 iPad Safari。[Apple 真机安装说明](https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension)

## 更新代码与构建

根目录仍是 Chrome 版本的源代码。Safari 的资源是生成副本，修改根目录后执行：

```bash
python3 safari/update-resources.py
```

脚本只复制 `manifest.json`、`content/`、`popup/`、`shared/`、`icons/`，不会包含本地截图或 QA 目录。Safari 不支持的 `include_globs` 会转换为等价的首页匹配规则。

以下命令先同步资源，再进行不签名的编译检查：

```bash
bash safari/build.sh macos
bash safari/build.sh ios
```

使用现有开发者账号进行签名构建：

```bash
ZF_DEVELOPMENT_TEAM=你的TeamID bash safari/build.sh macos
ZF_DEVELOPMENT_TEAM=你的TeamID ZF_DEVICE_ID=你的设备ID bash safari/build.sh ios
```

脚本会在有需要时请求 Xcode 更新开发描述文件，不会执行上架或发布。输出在 `build/safari-macos/` 和 `build/safari-ios/`，均已被 Git 忽略。

## 设置与验证

Safari 版使用 `storage.local`，Mac 与 iPad 分别保存设置，不承诺跨设备自动同步。Apple 说明 Safari 的 `storage.sync` 提供存储接口，但不支持同步；Chrome 版继续使用原来的同步设置。[Apple 兼容性说明](https://developer.apple.com/documentation/safariservices/assessing-your-safari-web-extension-s-browser-compatibility)

```bash
node --test tests/*.test.cjs
ZF_EXTENSION_ROOT='safari/ZhihuFocus/Shared (Extension)/Resources' ZF_STORAGE_AREA=local node --test tests/theme.test.cjs
```

基础检查覆盖资源完整性、首页匹配范围，以及 Safari 本地设置下的三种深色主题、系统模式变化和设置更新。网站页面仍使用现有的桌面布局，不保证 iPad 窄分屏或手机页面的显示效果。
