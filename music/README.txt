BGM配乐文件夹
============

请将你的音乐文件放到这个文件夹，文件名对应如下：

- menu.mp3      主菜单音乐
- daily.mp3     日常场景（默认BGM）
- warm.mp3      温馨场景
- tension.mp3   紧张场景
- sad.mp3       悲伤场景
- romantic.mp3  浪漫场景
- happy.mp3     欢快场景

支持的格式：mp3, ogg, wav

如果你想添加更多曲目，编辑 js/systems/BGMSystem.js 中的 tracks 配置。

使用方法：
---------
BGM系统会自动在以下时机播放：
1. 主菜单 - 播放 menu.mp3
2. 进入游戏 - 播放 daily.mp3
3. 根据AI对话内容自动切换（可选功能）

手动控制：
---------
在浏览器控制台中可以使用：
- game.bgmSystem.play('daily')     播放指定曲目
- game.bgmSystem.stop()            停止播放
- game.bgmSystem.setVolume(0.5)    设置音量(0-1)
- game.bgmSystem.toggleMute()      静音/取消静音
- game.bgmSystem.getTrackList()    查看所有曲目
