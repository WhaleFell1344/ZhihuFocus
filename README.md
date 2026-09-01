# ZhihuFocus

ZhihuFocus 是一个面向知乎与豆瓣的 Chrome 专注阅读扩展。它通过隐藏侧栏、广告及非核心模块，重新整理内容区域，并提供可同步的阅读外观设置，让页面更适合持续阅读。

## 功能

- 一键开启或关闭专注模式，关闭后立即恢复网站原始布局。
- 居中知乎与豆瓣的主要内容，减少侧栏和广告干扰。
- 提供默认、暖纸、柔灰、护眼绿、雾蓝、淡紫灰六种阅读背景。
- 支持调整正文字体、字号、行距、段距和内容宽度。
- 知乎首页支持只刷新中间信息流，不刷新整个页面。
- 知乎非首页页面提供快捷返回首页按钮。
- 设置保存在 `chrome.storage.sync`，可随同一 Google 账号同步到其他 Chrome 浏览器。

## 支持页面

### 知乎

- 首页：`https://www.zhihu.com/`
- 问题与回答页：`https://www.zhihu.com/question/*`
- 搜索页：`https://www.zhihu.com/search*`
- 知乎专栏文章：`https://zhuanlan.zhihu.com/p/*`

### 豆瓣

- 豆瓣首页：`https://www.douban.com/`
- 豆瓣搜索页：`https://www.douban.com/search*`
- 豆瓣电影条目页：`https://movie.douban.com/subject/*`
- 豆瓣图书条目页：`https://book.douban.com/subject/*`
- 豆瓣影评页：`https://movie.douban.com/review/*`
- 豆瓣书评页：`https://book.douban.com/review/*`

扩展只针对以上页面进行适配，不保证其他知乎或豆瓣页面的显示效果。

## 安装

### Chrome Web Store

商店版本正在审核。审核通过后，可通过扩展 ID `gkmgpjmppdcghophgbemamlkobneiogm` 安装并自动接收更新。

### 本地安装

1. 下载或克隆本仓库。
2. 在 Chrome 地址栏打开 `chrome://extensions/`。
3. 开启右上角的“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择本仓库根目录。

修改代码后，在扩展管理页点击 ZhihuFocus 的刷新按钮，再重新打开或刷新目标网页即可生效。

## 使用

点击 Chrome 工具栏中的 ZhihuFocus 图标，可以：

- 开启或关闭专注阅读。
- 切换阅读背景。
- 调整知乎正文的字体、字号、行距、段距和内容宽度。
- 一键恢复默认外观设置。

豆瓣页面复用背景主题，但不会应用知乎的字体、字号、行距、段距和阅读宽度设置。

## 隐私

ZhihuFocus 不收集、出售或向外部服务器传输用户数据，也不使用远程代码。扩展仅使用 `storage` 权限保存和同步用户设置。完整说明见 [PRIVACY.md](PRIVACY.md)。

## 开发与检查

本项目不需要构建步骤或第三方运行时依赖。提交改动前可执行基础检查：

```bash
node --check content/focus.js
node --check popup/popup.js
python3 -m json.tool manifest.json >/dev/null
git diff --check
```

页面样式依赖网站当前 DOM；知乎或豆瓣改版后，部分选择器可能需要同步调整。

## 项目结构

```text
content/       页面脚本与知乎、豆瓣样式
icons/         扩展图标
popup/         扩展弹窗
store-assets/  Chrome Web Store 商品素材
manifest.json  Chrome Manifest V3 配置
PRIVACY.md     隐私说明
```
