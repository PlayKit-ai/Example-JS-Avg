# 🎮 AI Galgame

一个完全由 AI 驱动的原生 Galgame，集成智能对话、动态图像生成和背景音乐系统。

![Preview](styles/spray_i358.PNG)

## ✨ 特性

- 🤖 **AI 智能对话** - 基于 Qwen 大模型，角色对话自然流畅
- 🎨 **实时图像生成** - 实时生成角色立绘和场景背景
- 🎼 **BGM 系统** - 背景音乐自动切换，淡入淡出
- 💾 **存档系统** - 本地存储 + 文件导出
- 🌸 **沉浸体验** - 经典 Galgame 风格 UI

## 🚀 快速开始

### 方法一：一键启动（推荐）

**Mac/Linux 用户：**
```bash
npm run dev
```

**Windows 用户：**
```bash
npm run dev:win
```

这会自动启动存档服务器和游戏服务器，然后访问：http://localhost:8080

### 方法二：手动启动（完整功能，支持自动保存）

需要同时启动两个服务：

**第一步：启动存档服务器**
```bash
# 在第一个终端/命令行窗口运行
npm start
```

**第二步：启动游戏服务器**
```bash
# 在第二个终端/命令行窗口运行
npm run serve
```

然后访问：http://localhost:8080

### 方法三：简化模式（无自动保存）

直接在浏览器中打开 `index.html` 文件

> ⚠️ 注意：此模式下自动保存功能不可用，但游戏数据仍会保存到浏览器 localStorage。

## 📁 项目结构

```
├── index.html              # 游戏主页面
├── js/
│   ├── main.js             # 主控制器
│   ├── systems/
│   │   ├── DialogueSystem.js       # 对话系统
│   │   ├── ImageGenerationSystem.js # 图像生成
│   │   └── BGMSystem.js            # 背景音乐
│   ├── managers/
│   │   ├── GameSessionManager.js   # 游戏会话
│   │   └── StorageManager.js       # 存储管理
│   └── models/
│       └── CharacterProfile.js     # 角色模型
├── styles/                 # 样式文件
├── music/                  # BGM 音乐文件（需自行添加）
└── saved_games/            # 存档文件夹
```

## 🎵 BGM 配置

将音乐文件放入 `music/` 文件夹：

| 文件名 | 用途 |
|--------|------|
| menu.mp3 | 主菜单 |
| daily.mp3 | 日常场景 |
| warm.mp3 | 温馨场景 |
| romantic.mp3 | 浪漫场景 |
| sad.mp3 | 悲伤场景 |
| happy.mp3 | 欢快场景 |
| tension.mp3 | 紧张场景 |

## 💾 存档系统

### 自动保存

在游戏设置中启用"自动保存"后，每次对话完成都会自动保存到 `saved_games/` 文件夹。

**特点：**
- 每个角色对应一个存档文件（按角色名命名）
- 每次对话后自动覆盖更新该角色的存档
- 文件名格式：`角色名.json`（例如：`小美.json`）
- 切换到新角色时会创建新的存档文件

**要求：**
- 必须启动存档服务器（`npm start`）

### 手动保存

点击游戏内菜单的"保存"按钮，手动创建存档。

**特点：**
- 使用时间戳命名，不会覆盖
- 文件名格式：`YYYY-MM-DD_HH-MM-SS.json`
- 可以保留多个时间点的存档

### 加载存档

点击游戏内菜单的"读取"按钮：
- 如果服务器运行中，显示存档列表供选择
- 否则使用文件选择器加载本地存档

---

## 📝 详细启动指南

### Windows 用户

**方式 1：使用 CMD**
```cmd
# 窗口1：启动存档服务器
npm start

# 窗口2：启动游戏服务器
npm run serve
```

**方式 2：使用 PowerShell（一行命令）**
```powershell
Start-Process cmd -ArgumentList "/k npm start"; Start-Process cmd -ArgumentList "/k npm run serve"
```

### Mac/Linux 用户

**方式 1：使用两个终端窗口**
```bash
# 终端1：启动存档服务器
npm start

# 终端2：启动游戏服务器
npm run serve
```

**方式 2：后台运行（一行命令）**
```bash
npm start & npm run serve
```

### 使用 VS Code

1. 打开项目文件夹
2. 打开终端（Ctrl+` 或 Cmd+`）
3. 点击终端右上角的 `+` 创建新终端
4. 在第一个终端运行 `npm start`
5. 在第二个终端运行 `npm run serve`

---

## ⚙️ 配置说明

### API 配置

**推荐方式：在游戏设置中配置（无需修改代码）**

1. 启动游戏后，点击主菜单的"游戏设定"按钮
2. 在设置界面的"API 配置"部分填写：
   - **Game ID**：你的 PlayKit 游戏 ID
   - **Developer Token**：你的 PlayKit 开发者令牌
   - **Base URL**：API 地址（默认：`https://playkit.ai`）
   - **默认 AI 模型**：对话模型（默认：`Qwen3-235B`）
   - **默认图像模型**：图像生成模型（默认：`gpt-image-1`）
3. 点击"保存设置"

配置会保存到浏览器 localStorage，下次启动自动加载。

**备选方式：修改代码配置**

如果需要设置默认值，可以编辑 `js/managers/GameSessionManager.js`：

```javascript
this.sdkConfig = {
    gameId: 'your-game-id',
    developerToken: 'your-token',
    baseURL: 'https://playkit.ai',
    defaultChatModel: 'Qwen3-235B',
    defaultImageModel: 'gpt-image-1'
};
```

> 💡 提示：推荐使用游戏内设置界面配置，更方便且不需要修改代码。

### 游戏设置

在游戏设置界面可以配置：

**🔊 音频设置**
- BGM 音量调节（0-100%）
- BGM 开关
- 音效音量（预留）

**�️ 显示设置**
- 界面缩放（80% / 100% / 120%）
- 对话文字速度（慢 / 中 / 快）
- 自动播放延迟时间

**⚙️ 游戏设置**
- 自动保存开关

**🔑 API 配置**
- PlayKit SDK 配置（Game ID、Token、Base URL）
- 默认 AI 模型选择
- 默认图像模型选择

**🗂️ 数据管理**
- 清除所有缓存
- 清除图像缓存
- 清除对话历史

> ⚠️ 注意：SDK 通过 CDN 引入，无需 `npm install` 即可运行。`package.json` 中的依赖仅作参考。

## 🎮 游戏玩法

1. **配置 API** - 在设置中填写 PlayKit API 凭证
2. **创建角色** - 设定玩家和 AI 角色属性
3. **开始对话** - 与 AI 角色自由交流
4. **动态视觉** - 根据对话生成图像和背景
5. **保存进度** - 自动保存或手动存档

## 🛠️ 技术栈

- 前端：原生 JavaScript + HTML5 + CSS3
- AI 对话：PlayKit SDK + Qwen
- 图像生成：PlayKit SDK + gpt-image-1
- 后端：Node.js (存档服务器)

## 📄 开源协议

MIT License

## 🙏 致谢

- [PlayKit SDK](https://playkit.ai)

