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

### 1. 安装依赖

```bash
npm install
```

### 2. 访问游戏

直接在浏览器中打开 `index.html`

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

## ⚙️ 配置说明

### API 配置

编辑 `js/managers/GameSessionManager.js`：

```javascript
this.sdkConfig = {
    gameId: 'your-game-id',
    developerToken: 'your-token',
    baseURL: 'https://lab-staging.playkit.ai',
    defaultChatModel: 'Qwen3-235B',
    defaultImageModel: 'gpt-image-1'
};
```

> ⚠️ 注意：SDK 通过 CDN 引入，无需 `npm install` 即可运行。`package.json` 中的依赖仅作参考。

## 🎮 游戏玩法

1. **创建角色** - 设定玩家和 AI 角色属性
2. **开始对话** - 与 AI 角色自由交流
3. **动态视觉** - 根据对话生成图像和背景
4. **保存进度** - 随时存档和读档

## 🛠️ 技术栈

- 前端：原生 JavaScript + HTML5 + CSS3
- AI 对话：PlayKit SDK + Qwen
- 图像生成：PlayKit SDK + gpt-image-1

## 📄 开源协议

MIT License

## 🙏 致谢

- [PlayKit SDK](https://playkit.ai)

