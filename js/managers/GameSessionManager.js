/**
 * 游戏会话管理器
 * 负责整个游戏会话的生命周期管理和状态控制
 */

class GameSessionManager {
    constructor(imageSystem = null) {
        this.storageManager = new StorageManager();
        this.dialogueSystem = new DialogueSystem(this.storageManager);
        this.imageSystem = imageSystem || new ImageGenerationSystem(this.storageManager);
        
        this.gameState = 'initial';
        this.playerProfile = null;
        this.aiProfile = null;
        this.isInitialized = false;
        
        // DOM元素引用 - 延迟初始化
        this.elements = {};

        // 聊天历史记录
        this.chatHistory = [];
        this.isHistoryCollapsed = false;

        // SDK配置 - 请填入你自己的配置
        this.sdkConfig = {
            gameId: 'your-game-id',
            developerToken: 'your-developer-token',
            baseURL: 'https://lab-staging.playkit.ai',
            defaultChatModel: 'Qwen3-235B',
            defaultImageModel: 'gpt-image-1',
            debug: true
        };
    }

    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        this.elements = {
            // 游戏界面元素
            dialogueText: document.getElementById('dialogue-text'),
            characterNameText: document.getElementById('character-name-text'),
            playerInput: document.getElementById('player-input'),
            sendButton: document.getElementById('send-message'),
            characterImage: document.getElementById('character-image'),
            imageContainer: document.getElementById('character-image-container'),
            imageLoading: document.getElementById('image-loading'),
            backgroundImage: document.getElementById('background-image'),
            backgroundLoading: document.getElementById('background-loading'),
            inputArea: document.getElementById('input-area'),
            choiceArea: document.getElementById('choice-area'),
            // 聊天历史记录元素
            chatHistoryArea: document.getElementById('chat-history-area'),
            chatHistoryContent: document.getElementById('chat-history-content'),
            chatHistoryMessages: document.getElementById('chat-history-messages'),
            toggleHistoryBtn: document.getElementById('toggle-history')
        };
    }

    /**
     * 初始化游戏会话
     * @param {CharacterProfile} playerProfile - 玩家角色
     * @param {CharacterProfile} aiProfile - AI角色
     */
    async initialize(playerProfile, aiProfile) {
        try {
            console.log('Initializing game session...');
            
            // 初始化DOM元素引用
            this.initializeElements();
            
            this.playerProfile = playerProfile;
            this.aiProfile = aiProfile;
            
            // 初始化图像生成系统（如果还没有初始化）
            if (!this.imageSystem.isInitialized) {
                await this.imageSystem.initialize(this.sdkConfig);
            }
            
            // 初始化对话系统（使用独立的SDK实例以避免冲突）
            await this.dialogueSystem.initialize(aiProfile, this.sdkConfig);
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 加载历史对话
            await this.loadDialogueHistory();
            
            // 检查是否已有角色图像，如果没有则生成
            await this.loadOrGenerateCharacterImage();
            
            // 生成场景背景
            await this.generateSceneBackground();
            
            this.gameState = 'gameplay';
            this.isInitialized = true;
            
            console.log('Game session initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize game session:', error);
            throw new Error('游戏会话初始化失败');
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 发送消息按钮
        this.elements.sendButton.addEventListener('click', () => this.handleSendMessage());
        
        // 输入框回车发送
        this.elements.playerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // 输入框自动调整高度
        this.elements.playerInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
        });

        // 游戏内菜单按钮事件
        const saveButton = document.getElementById('menu-save');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveGameToFile();
            });
        }

        const loadButton = document.getElementById('menu-load');
        if (loadButton) {
            loadButton.addEventListener('click', () => {
                this.loadGameFromFile();
            });
        }

        const clearButton = document.getElementById('menu-clear');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (confirm('确定要清除所有缓存吗？这将删除所有本地数据！')) {
                    this.storageManager.clearAllCache();
                }
            });
        }

        const exitButton = document.getElementById('menu-exit');
        if (exitButton) {
            exitButton.addEventListener('click', () => {
                if (confirm('确定要退出游戏吗？')) {
                    window.location.href = '#main-menu';
                    window.location.reload();
                }
            });
        }

        // 设置按钮事件
        const configButton = document.getElementById('menu-config');
        console.log('Config button found:', !!configButton);
        if (configButton) {
            console.log('Adding click listener to config button');
            configButton.addEventListener('click', () => {
                console.log('Config button clicked!');
                this.showSettingsMenu();
            });
        } else {
            console.error('Config button not found!');
        }

        // 设置菜单事件监听器（现在使用原生弹窗，不需要复杂的监听器）
        // this.setupSettingsMenuListeners();

        // 应用保存的UI缩放设置
        const savedScale = localStorage.getItem('ui-scale') || '0.8';
        this.applyUIScale(savedScale);

        // 聊天历史记录切换按钮
        this.elements.toggleHistoryBtn.addEventListener('click', () => {
            this.toggleChatHistory();
        });
    }

    /**
     * 显示设置菜单 - 使用浏览器原生弹窗
     */
    showSettingsMenu() {
        console.log('showSettingsMenu called - using native dialogs');
        
        const options = [
            '1. 清除所有缓存',
            '2. 清除图像缓存',
            '3. 清除人物图像缓存',
            '4. 清除背景图缓存',
            '5. 导出游戏数据',
            '6. 导入游戏数据',
            '7. 界面缩放设置',
            '0. 关闭设置'
        ].join('\n');
        
        const choice = prompt('🎮 游戏设置\n\n' + options + '\n\n请输入选项编号:');
        
        if (!choice) return;
        
        switch(choice.trim()) {
            case '1':
                this.handleClearAllCache();
                break;
            case '2':
                this.handleClearImageCache();
                break;
            case '3':
                this.handleClearCharacterImageCache();
                break;
            case '4':
                this.handleClearBackgroundImageCache();
                break;
            case '5':
                this.handleExportData();
                break;
            case '6':
                this.handleImportData();
                break;
            case '7':
                this.handleUIScaleSettings();
                break;
            case '0':
                return;
            default:
                alert('无效选项，请重新选择');
                this.showSettingsMenu();
        }
    }

    /**
     * 处理清除所有缓存
     */
    handleClearAllCache() {
        if (confirm('确定要清除所有缓存吗？这将删除所有本地数据！')) {
            try {
                this.storageManager.clearAllCache();
                alert('✅ 所有缓存已清除！');
            } catch (error) {
                alert('❌ 清除缓存失败：' + error.message);
            }
        }
        this.showSettingsMenu();
    }

    /**
     * 处理清除图像缓存
     */
    handleClearImageCache() {
        if (confirm('确定要清除图像缓存吗？这将删除所有缓存的角色和背景图像。')) {
            try {
                this.storageManager.clearImageCache();
                alert('✅ 图像缓存已清除！');
            } catch (error) {
                alert('❌ 清除图像缓存失败：' + error.message);
            }
        }
        this.showSettingsMenu();
    }

    /**
     * 处理清除人物图像缓存
     */
    handleClearCharacterImageCache() {
        if (confirm('确定要清除人物图像缓存吗？这将删除所有缓存的角色图像。')) {
            try {
                this.storageManager.clearCharacterImageCache();
                alert('✅ 人物图像缓存已清除！');
            } catch (error) {
                alert('❌ 清除人物图像缓存失败：' + error.message);
            }
        }
        this.showSettingsMenu();
    }

    /**
     * 处理清除背景图缓存
     */
    handleClearBackgroundImageCache() {
        if (confirm('确定要清除背景图缓存吗？这将删除所有缓存的背景图像。')) {
            try {
                this.storageManager.clearBackgroundImageCache();
                alert('✅ 背景图缓存已清除！');
            } catch (error) {
                alert('❌ 清除背景图缓存失败：' + error.message);
            }
        }
        this.showSettingsMenu();
    }

    /**
     * 处理导出游戏数据
     */
    handleExportData() {
        try {
            const gameData = this.storageManager.collectAllGameData();
            const dataStr = JSON.stringify(gameData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-galgame-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('✅ 游戏数据导出成功！');
        } catch (error) {
            alert('❌ 导出失败：' + error.message);
        }
        this.showSettingsMenu();
    }

    /**
     * 处理导入游戏数据
     */
    handleImportData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) {
                this.showSettingsMenu();
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const gameData = JSON.parse(e.target.result);
                    
                    if (confirm('确定要导入这个备份吗？当前数据将被覆盖！')) {
                        this.storageManager.restoreAllGameData(gameData);
                        alert('✅ 游戏数据导入成功！页面将刷新以应用新数据。');
                        window.location.reload();
                    } else {
                        this.showSettingsMenu();
                    }
                } catch (error) {
                    alert('❌ 导入失败：文件格式不正确');
                    this.showSettingsMenu();
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    /**
     * 处理界面缩放设置
     */
    handleUIScaleSettings() {
        const currentScale = localStorage.getItem('ui-scale') || '0.8';
        const scaleOptions = [
            '1. 80% (推荐)',
            '2. 100% (标准)',
            '3. 120% (放大)',
            '',
            '当前设置: ' + (currentScale === '0.8' ? '80%' : currentScale === '1.0' ? '100%' : '120%'),
            '',
            '0. 返回上级菜单'
        ].join('\n');
        
        const choice = prompt('🔧 界面缩放设置\n\n' + scaleOptions + '\n\n请输入选项编号:');
        
        if (!choice) {
            this.showSettingsMenu();
            return;
        }
        
        let newScale = currentScale;
        switch(choice.trim()) {
            case '1':
                newScale = '0.8';
                break;
            case '2':
                newScale = '1.0';
                break;
            case '3':
                newScale = '1.2';
                break;
            case '0':
                this.showSettingsMenu();
                return;
            default:
                alert('无效选项');
                this.handleUIScaleSettings();
                return;
        }
        
        if (newScale !== currentScale) {
            localStorage.setItem('ui-scale', newScale);
            this.applyUIScale(newScale);
            alert('✅ 界面缩放已设置为 ' + (newScale === '0.8' ? '80%' : newScale === '1.0' ? '100%' : '120%'));
        }
        
        this.handleUIScaleSettings();
    }

    applyUIScale(scale) {
        const gameMain = document.getElementById('game-main');
        if (gameMain) {
            if (scale === '1.0') {
                gameMain.style.zoom = '';
            } else {
                gameMain.style.zoom = scale;
            }
        }
    }

    /**
     * 隐藏设置菜单 - 原生弹窗版本不需要
     */
    hideSettingsMenu() {
        // 原生弹窗版本不需要此方法
    }

    /**
     * 处理发送消息
     */
    async handleSendMessage() {
        const message = this.elements.playerInput.value.trim();
        
        if (!message) {
            // 静默返回，不显示弹窗
            return;
        }

        if (this.dialogueSystem.isProcessingMessage()) {
            // 静默返回，不显示弹窗
            return;
        }

        try {
            // 禁用输入
            this.setInputEnabled(false);
            
            // 记录玩家消息到历史记录
            this.addToChatHistory(message, 'player');
            
            // 清空输入框
            this.elements.playerInput.value = '';
            this.adjustTextareaHeight();
            
            // 显示"思考中"状态
            this.elements.dialogueText.textContent = '...';
            
            // 发送消息并获取AI回复
            let fullReply = '';
            await this.dialogueSystem.sendMessageStream(
                message,
                (chunk) => {
                    // 流式更新不在这里处理，等完整回复后再显示
                    fullReply += chunk;
                },
                async (completeReply) => {
                    // 显示完整的AI回复
                    this.showMessage(completeReply, 'ai');
                    
                    // 回复完成后，尝试生成新图像
                    await this.handleImageGeneration(completeReply);
                }
            );
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showError(error.message);
        } finally {
            // 重新启用输入
            this.setInputEnabled(true);
            this.elements.playerInput.focus();
        }
    }

    /**
     * 处理图像生成
     * @param {string} aiMessage - AI回复内容
     */
    async handleImageGeneration(aiMessage) {
        try {
            console.log('🖼️ 检查是否需要生成新图像...');
            console.log('📝 AI消息内容:', aiMessage);
            
            // 分析是否需要生成新图像
            const imageResult = await this.imageSystem.analyzeAndGenerateImage(aiMessage, this.aiProfile);
            
            if (imageResult) {
                if (imageResult.type === 'background') {
                    console.log('🌄 生成新背景图像');
                    this.showBackgroundImage(imageResult.url);
                } else if (imageResult.type === 'character') {
                    console.log('🎭 生成新角色图像');
                    this.showCharacterImage(imageResult.url);
                }
            } else {
                console.log('✅ 无需生成新图像，保持当前显示');
            }
            
        } catch (error) {
            console.error('Failed to generate image:', error);
            // 图像生成失败不影响对话流程，只记录错误
        }
    }

    /**
     * 加载或生成角色图像
     */
    async loadOrGenerateCharacterImage() {
        try {
            // 首先尝试从缓存加载
            const cachedImageUrl = this.storageManager.loadCharacterImage(this.aiProfile);
            if (cachedImageUrl) {
                console.log('Using cached character image');
                this.showCharacterImage(cachedImageUrl);
                return;
            }
            
            // 检查是否已有当前角色图像
            const currentImage = this.imageSystem.getCurrentCharacterImage();
            
            if (currentImage && currentImage.url) {
                console.log('Using existing character image');
                this.showCharacterImage(currentImage.url);
            } else {
                console.log('No existing image found, generating new one...');
                await this.generateInitialCharacterImage();
            }
            
        } catch (error) {
            console.error('Failed to load or generate character image:', error);
            this.showImageError('图像加载失败');
        }
    }

    /**
     * 生成初始角色图像
     */
    async generateInitialCharacterImage() {
        try {
            this.showImageLoading('正在生成角色图像...');
            
            const imageUrl = await this.imageSystem.generateInitialCharacterImage(this.aiProfile);
            this.showCharacterImage(imageUrl);
            
        } catch (error) {
            console.error('Failed to generate initial character image:', error);
            this.showImageError('图像生成失败');
        }
    }

    /**
     * 生成场景背景
     */
    async generateSceneBackground() {
        try {
            this.showBackgroundLoading('正在加载场景背景...');
            
            // 基于AI角色设定生成场景描述
            const sceneDescription = this.generateSceneDescription();
            console.log('🌄 Scene description:', sceneDescription);
            
            // 首先尝试从缓存加载
            const cachedBackgroundUrl = this.storageManager.loadBackgroundImage(sceneDescription);
            console.log('🔍 Cached background URL:', cachedBackgroundUrl ? `found (${cachedBackgroundUrl.length} chars)` : 'not found');
            
            if (cachedBackgroundUrl) {
                console.log('✅ Using cached background image');
                this.showBackgroundImage(cachedBackgroundUrl);
                return;
            }
            
            // 没有缓存，检查是否有任何背景图缓存（可能是不同场景描述的）
            const bgCache = this.storageManager.loadBackgroundImageCache();
            const cacheKeys = Object.keys(bgCache);
            console.log('📦 Background cache keys:', cacheKeys.length);
            
            if (cacheKeys.length > 0) {
                // 使用最近的一个背景图
                const latestKey = cacheKeys.sort((a, b) => {
                    return (bgCache[b].timestamp || 0) - (bgCache[a].timestamp || 0);
                })[0];
                const latestBg = bgCache[latestKey];
                if (latestBg && latestBg.imageUrl) {
                    console.log('✅ Using latest cached background from different scene');
                    this.showBackgroundImage(latestBg.imageUrl);
                    return;
                }
            }
            
            // 没有任何缓存，生成新背景
            console.log('🎨 No cache found, generating new background...');
            this.showBackgroundLoading('正在生成场景背景...');
            const backgroundUrl = await this.imageSystem.generateSceneImage(sceneDescription);
            this.showBackgroundImage(backgroundUrl);
            
        } catch (error) {
            console.error('Failed to generate scene background:', error);
            this.hideBackgroundLoading();
            // 背景生成失败不影响游戏进行，使用默认背景
        }
    }

    /**
     * 生成场景描述
     */
    generateSceneDescription() {
        // 基于AI角色的设定生成合适的场景
        const settings = this.aiProfile.settings.toLowerCase();
        
        if (settings.includes('学校') || settings.includes('同学') || settings.includes('班级')) {
            return 'beautiful anime school campus, cherry blossoms, sunny day, peaceful atmosphere';
        } else if (settings.includes('咖啡') || settings.includes('店')) {
            return 'cozy anime cafe interior, warm lighting, comfortable atmosphere';
        } else if (settings.includes('图书馆')) {
            return 'quiet anime library, bookshelves, soft sunlight through windows';
        } else if (settings.includes('公园')) {
            return 'beautiful anime park scene, green trees, peaceful lake';
        } else {
            return 'beautiful anime outdoor scene, soft lighting, peaceful atmosphere, cherry blossoms';
        }
    }

    /**
     * 显示背景加载状态
     */
    showBackgroundLoading(text = '正在生成场景背景...') {
        this.elements.backgroundImage.style.display = 'none';
        this.elements.backgroundLoading.style.display = 'flex';
        
        const loadingText = this.elements.backgroundLoading.querySelector('p');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    /**
     * 显示背景图像
     */
    showBackgroundImage(imageUrl) {
        const fixedUrl = this.fixImageUrl(imageUrl);
        
        console.log('🌄 显示背景图像, URL长度:', fixedUrl ? fixedUrl.length : 'null');
        
        this.elements.backgroundLoading.style.display = 'none';
        this.elements.backgroundImage.src = fixedUrl;
        this.elements.backgroundImage.classList.add('loaded');
        this.elements.backgroundImage.style.display = 'block';
        
        this.elements.backgroundImage.onload = () => {
            console.log('✅ 背景图像加载成功');
        };
        
        this.elements.backgroundImage.onerror = () => {
            console.error('❌ 背景图像加载失败');
            this.hideBackgroundLoading();
        };
    }

    /**
     * 隐藏背景加载状态
     */
    hideBackgroundLoading() {
        this.elements.backgroundLoading.style.display = 'none';
        // 如果背景生成失败，使用CSS渐变作为默认背景
        if (!this.elements.backgroundImage.src) {
            this.elements.backgroundImage.style.background = 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)';
            this.elements.backgroundImage.style.display = 'block';
        }
    }







































    fixImageUrl(imageUrl) {
        if (!imageUrl) return imageUrl;
        
        // 检查并修复重复的data URL前缀
        if (imageUrl.includes('data:image/png;base64,data:image/png;base64,')) {
            console.warn('🔧 GameSession: 检测到重复的data URL前缀，正在修复...');
            imageUrl = imageUrl.replace(/^data:image\/png;base64,data:image\/png;base64,/, 'data:image/png;base64,');
        }
        
        // 检查其他类型的重复前缀
        if (/^data:[^,]*,data:/.test(imageUrl)) {
            console.warn('🔧 GameSession: 检测到其他类型的重复前缀，正在修复...');
            imageUrl = imageUrl.replace(/^data:[^,]*,data:/, 'data:');
        }
        
        return imageUrl;
    }

    /**
     * 显示角色图像 - 带抠图功能
     * @param {string} imageUrl - 图像URL
     * @param {string} animation - 进场动画类型
     */
    showCharacterImage(imageUrl, animation = 'enter-right') {
        // 修复可能的URL问题
        const fixedUrl = this.fixImageUrl(imageUrl);
        
        console.log('🎭 显示角色图像, URL长度:', fixedUrl ? fixedUrl.length : 'null');
        
        // 隐藏加载状态
        this.elements.imageLoading.style.display = 'none';
        
        // 清除所有动画类和抠图处理状态
        const animationClasses = ['enter-right', 'enter-left', 'fade-in', 'slide-up', 'exit-right', 'exit-left'];
        animationClasses.forEach(cls => this.elements.characterImage.classList.remove(cls));
        
        // 清除抠图处理状态，确保新图像会被重新处理
        this.elements.characterImage.classList.remove('canvas-processed', 'canvas-processing');
        
        // 设置图像源
        this.elements.characterImage.src = fixedUrl;
        this.elements.characterImage.style.display = 'block';
        
        // 添加新的进场动画
        this.elements.characterImage.classList.add(animation);
        
        // 图像加载完成后自动应用抠图
        this.elements.characterImage.onload = () => {
            console.log('✅ 角色图像加载完成，应用抠图');
            setTimeout(() => {
                this.applyAutoChromaKey();
            }, 100);
        };
        
        this.elements.characterImage.onerror = () => {
            console.error('❌ 角色图像加载失败');
            this.showImageError('图像加载失败');
        };
    }

    /**
     * 自动应用抠图 - 简化版本
     */
    async applyAutoChromaKey() {
        try {
            const img = this.elements.characterImage;
            if (!img.src || img.classList.contains('canvas-processing')) {
                return;
            }

            // 检查是否是已经处理过的data URL
            if (img.src.startsWith('data:image/png;base64,') && img.classList.contains('canvas-processed')) {
                console.log('🔄 图像已是处理后的data URL，跳过');
                return;
            }

            console.log('🎨 开始自动抠图处理...');
            img.classList.add('canvas-processing');

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 等待图像完全加载
            await new Promise((resolve, reject) => {
                if (img.complete && img.naturalWidth > 0) {
                    resolve();
                } else {
                    const tempImg = new Image();
                    tempImg.onload = resolve;
                    tempImg.onerror = reject;
                    tempImg.src = img.src;
                }
            });

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // 白色抠图算法
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // 计算亮度和色彩偏差
                const brightness = (r + g + b) / 3;
                const colorDeviation = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
                
                // 白色检测
                const isSuperWhite = brightness > 250 && colorDeviation < 10;
                const isVeryWhite = brightness > 235 && colorDeviation < 15;
                const isWhite = brightness > 220 && colorDeviation < 20;
                const isLightColor = brightness > 200 && colorDeviation < 25;
                const isGrayish = brightness > 180 && colorDeviation < 15;
                
                if (isSuperWhite) {
                    // 完全透明
                    data[i + 3] = 0;
                } else if (isVeryWhite) {
                    // 几乎透明
                    data[i + 3] = Math.max(0, 255 - (brightness - 200) * 4);
                } else if (isWhite) {
                    // 半透明
                    data[i + 3] = Math.max(0, 255 - (brightness - 180) * 3);
                } else if (isLightColor) {
                    // 轻微透明
                    data[i + 3] = Math.max(0, 255 - (brightness - 160) * 2);
                } else if (isGrayish) {
                    // 灰色边缘处理
                    data[i + 3] = Math.max(0, 255 - (brightness - 140) * 1.5);
                }
            }

            ctx.putImageData(imageData, 0, 0);
            const processedDataUrl = canvas.toDataURL('image/png');
            
            // 更新图像源
            img.onload = null; // 防止无限循环
            img.src = processedDataUrl;
            
            // 标记为已处理
            img.classList.add('canvas-processed');
            img.classList.remove('canvas-processing');
            
            console.log('✅ 自动抠图处理完成');

        } catch (error) {
            console.error('❌ 自动抠图处理失败:', error);
            this.elements.characterImage.classList.remove('canvas-processing');
        }
    }





    /**
     * 显示图像加载状态
     * @param {string} text - 加载文本
     */
    showImageLoading(text = '正在生成图像...') {
        this.elements.characterImage.style.display = 'none';
        this.elements.imageLoading.style.display = 'flex';
        
        const loadingText = this.elements.imageLoading.querySelector('p');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    /**
     * 显示图像错误
     * @param {string} errorText - 错误文本
     */
    showImageError(errorText) {
        this.elements.imageLoading.style.display = 'flex';
        this.elements.characterImage.style.display = 'none';
        
        const loadingText = this.elements.imageLoading.querySelector('p');
        if (loadingText) {
            loadingText.textContent = errorText;
        }
        
        // 隐藏spinner
        const spinner = this.elements.imageLoading.querySelector('.loading-spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    /**
     * 加载对话历史
     */
    async loadDialogueHistory() {
        try {
            const history = this.dialogueSystem.getDialogueHistory();
            
            console.log('🔍 Loading dialogue history...');
            console.log('📝 History length:', history.length);
            console.log('🎭 AI Profile opening:', this.aiProfile.opening);
            
            // 设置角色名字
            this.elements.characterNameText.textContent = this.aiProfile.nickname;
            
            // 将DialogueSystem的历史记录同步到GameSessionManager的chatHistory
            this.chatHistory = [];
            history.forEach(entry => {
                const historyItem = {
                    message: entry.message,
                    sender: entry.sender,
                    timestamp: new Date(entry.timestamp),
                    senderName: entry.sender === 'player' ? this.playerProfile?.nickname || '玩家' : this.aiProfile?.nickname || 'AI'
                };
                this.chatHistory.push(historyItem);
            });
            
            // 更新聊天历史记录显示
            this.updateChatHistoryDisplay();
            
            // 如果没有历史对话且AI角色有开场白，显示开场白
            if (history.length === 0 && this.aiProfile.opening) {
                console.log('✅ Showing opening message:', this.aiProfile.opening);
                
                // 确保开场白文本正确编码
                const cleanOpening = this.aiProfile.opening.trim();
                this.showMessage(cleanOpening, 'ai');
                
                // 将开场白添加到对话历史
                const openingEntry = {
                    timestamp: Date.now(),
                    sender: 'ai',
                    message: cleanOpening
                };
                this.dialogueSystem.dialogueHistory.push(openingEntry);
                this.storageManager.saveDialogueHistory(this.dialogueSystem.dialogueHistory);
            } else if (history.length > 0) {
                console.log('📚 Loading last AI message from history');
                // 显示最后一条AI消息，但不添加到历史记录（因为已经在上面同步过了）
                const lastAiMessage = [...history].reverse().find(entry => entry.sender === 'ai');
                if (lastAiMessage) {
                    console.log('💬 Last AI message:', lastAiMessage.message);
                    this.showMessage(lastAiMessage.message, 'ai', false); // 不添加到历史记录
                }
            } else {
                console.log('❌ No opening message found');
            }
            
        } catch (error) {
            console.error('Failed to load dialogue history:', error);
        }
    }

    /**
     * 显示消息（galgame风格）
     * @param {string} message - 消息内容
     * @param {string} sender - 发送者类型 ('player' 或 'ai')
     * @param {boolean} addToHistory - 是否添加到历史记录，默认true
     */
    showMessage(message, sender, addToHistory = true) {
        console.log('💬 showMessage called:', { message, sender, addToHistory });
        console.log('💬 Message length:', message.length);
        console.log('💬 Message chars:', message.split('').map(c => c + '(' + c.charCodeAt(0) + ')').join(' '));
        
        // 检查是否有重复调用
        if (this._lastMessage === message && this._lastSender === sender) {
            console.warn('⚠️ Duplicate showMessage call detected, ignoring');
            return;
        }
        this._lastMessage = message;
        this._lastSender = sender;
        
        // 只有在需要时才添加到聊天历史记录
        if (addToHistory) {
            this.addToChatHistory(message, sender);
        }
        
        if (sender === 'ai') {
            // 显示AI消息
            this.elements.characterNameText.textContent = this.aiProfile.nickname;
            console.log('🎭 Setting character name to:', this.aiProfile.nickname);
            console.log('📝 Displaying message:', message);
            
            // 清理消息文本，确保没有重复字符
            const cleanMessage = this.cleanDisplayText(message);
            console.log('🧹 Cleaned message:', cleanMessage);
            
            this.typewriterEffect(cleanMessage);
        } else {
            // 玩家消息暂时不在对话框中显示，只记录到历史
            console.log(`${this.playerProfile.nickname}: ${message}`);
        }
    }

    /**
     * 清理显示文本，移除可能的重复字符
     * @param {string} text - 原始文本
     * @returns {string} 清理后的文本
     */
    cleanDisplayText(text) {
        if (!text) return text;
        
        // 检查是否已经有重复字符问题
        const hasRepeatedChars = /(.)\1{2,}/.test(text);
        if (!hasRepeatedChars) {
            return text; // 没有重复字符，直接返回
        }
        
        console.warn('🚨 Detected repeated characters in display text:', text);
        
        // 修复重复字符
        let cleaned = text.replace(/(.)\1+/g, (match, char) => {
            // 如果是标点符号，最多保留2个
            if (/[。！？~，、；：""''（）【】《》]/.test(char)) {
                return char.repeat(Math.min(match.length, 2));
            }
            // 其他字符只保留一个
            return char;
        });
        
        console.log('🧹 Fixed repeated characters:', text, '->', cleaned);
        return cleaned;
    }

    /**
     * 添加消息到聊天历史记录
     * @param {string} message - 消息内容
     * @param {string} sender - 发送者类型 ('player' 或 'ai')
     */
    addToChatHistory(message, sender) {
        const historyItem = {
            message: message,
            sender: sender,
            timestamp: new Date(),
            senderName: sender === 'player' ? this.playerProfile?.nickname || '玩家' : this.aiProfile?.nickname || 'AI'
        };
        
        this.chatHistory.push(historyItem);
        
        // 限制历史记录数量，保留最近50条
        if (this.chatHistory.length > 50) {
            this.chatHistory = this.chatHistory.slice(-50);
        }
        
        // 更新历史记录显示
        this.updateChatHistoryDisplay();
    }

    /**
     * 更新聊天历史记录显示
     */
    updateChatHistoryDisplay() {
        if (!this.elements.chatHistoryMessages) return;
        
        // 清空现有内容
        this.elements.chatHistoryMessages.innerHTML = '';
        
        // 显示最近的历史记录
        const recentHistory = this.chatHistory.slice(-20); // 只显示最近20条
        
        recentHistory.forEach(item => {
            const messageElement = document.createElement('div');
            messageElement.className = `history-message ${item.sender}`;
            
            const senderElement = document.createElement('div');
            senderElement.className = 'history-message-sender';
            senderElement.textContent = item.senderName;
            
            const contentElement = document.createElement('div');
            contentElement.textContent = item.message;
            
            messageElement.appendChild(senderElement);
            messageElement.appendChild(contentElement);
            
            this.elements.chatHistoryMessages.appendChild(messageElement);
        });
        
        // 滚动到底部
        this.elements.chatHistoryMessages.scrollTop = this.elements.chatHistoryMessages.scrollHeight;
    }

    /**
     * 切换聊天历史记录显示/隐藏
     */
    toggleChatHistory() {
        this.isHistoryCollapsed = !this.isHistoryCollapsed;
        
        if (this.isHistoryCollapsed) {
            this.elements.chatHistoryContent.classList.add('collapsed');
            this.elements.toggleHistoryBtn.textContent = '▼';
        } else {
            this.elements.chatHistoryContent.classList.remove('collapsed');
            this.elements.toggleHistoryBtn.textContent = '▲';
        }
    }

    /**
     * 打字机效果显示文本 - WebGAL风格
     * @param {string} text - 要显示的文本
     */
    async typewriterEffect(text) {
        console.log('⌨️ Starting typewriter effect for:', text);
        
        // 清空并重置对话框
        this.elements.dialogueText.textContent = '';
        this.elements.dialogueText.classList.add('typing');
        
        // 添加对话框进场动画
        this.elements.dialogueText.parentElement.parentElement.style.animation = 'dialogue-slide-up 0.5s ease-out';
        
        const speed = 50; // 打字速度 (ms)
        let displayedText = '';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            displayedText += char;
            
            // 直接设置文本内容，避免累加可能导致的重复
            this.elements.dialogueText.textContent = displayedText;
            
            console.log(`⌨️ Typed char ${i}: "${char}" (${char.charCodeAt(0)}) - Current text: "${displayedText}"`);
            
            // 如果是标点符号，稍微停顿
            if (/[。！？，、；：]/.test(char)) {
                await new Promise(resolve => setTimeout(resolve, speed * 2));
            } else {
                await new Promise(resolve => setTimeout(resolve, speed));
            }
        }
        
        // 移除打字光标
        this.elements.dialogueText.classList.remove('typing');
        
        console.log('⌨️ Typewriter effect completed. Final text:', this.elements.dialogueText.textContent);
        console.log('⌨️ Final text length:', this.elements.dialogueText.textContent.length);
    }



    /**
     * 调整输入框高度
     */
    adjustTextareaHeight() {
        const textarea = this.elements.playerInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    /**
     * 设置输入是否启用
     * @param {boolean} enabled - 是否启用
     */
    setInputEnabled(enabled) {
        this.elements.playerInput.disabled = !enabled;
        this.elements.sendButton.disabled = !enabled;
        
        if (enabled) {
            this.elements.sendButton.textContent = '发送';
        } else {
            this.elements.sendButton.textContent = '发送中...';
        }
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误消息
     */
    showError(message) {
        this.elements.characterNameText.textContent = '系统';
        this.elements.dialogueText.textContent = `错误: ${message}`;
        this.elements.dialogueText.style.color = '#c62828';
        
        // 3秒后恢复正常颜色
        setTimeout(() => {
            this.elements.dialogueText.style.color = '';
            this.elements.characterNameText.textContent = this.aiProfile.nickname;
        }, 3000);
    }

    /**
     * 清除对话历史
     */
    async clearDialogueHistory() {
        try {
            await this.dialogueSystem.clearHistory();
            this.elements.dialogueText.textContent = '';
            console.log('Dialogue history cleared');
        } catch (error) {
            console.error('Failed to clear dialogue history:', error);
            throw error;
        }
    }

    /**
     * 保存游戏状态
     */
    saveGameState() {
        try {
            this.storageManager.saveGameState(this.gameState);
            console.log('Game state saved');
        } catch (error) {
            console.error('Failed to save game state:', error);
        }
    }

    /**
     * 获取游戏统计信息
     * @returns {Object} 统计信息
     */
    getGameStats() {
        const dialogueStats = this.dialogueSystem.getStats();
        const imageStats = this.imageSystem.getStats();
        
        return {
            gameState: this.gameState,
            isInitialized: this.isInitialized,
            playerProfile: this.playerProfile ? this.playerProfile.nickname : null,
            aiProfile: this.aiProfile ? this.aiProfile.nickname : null,
            dialogue: dialogueStats,
            images: imageStats
        };
    }

    /**
     * 保存游戏到文件 - 自动保存到 saved_games 文件夹
     */
    async saveGameToFile() {
        try {
            console.log('💾 Saving game to saved_games folder...');
            
            // 收集游戏数据
            const gameData = this.storageManager.collectAllGameData();
            const saveData = {
                saveName: `自动存档`,
                saveTime: new Date().toISOString(),
                version: '1.0.0',
                gameData: gameData
            };

            // 调用服务器API保存
            const response = await fetch('http://localhost:3001/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ saveData })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || error.error);
            }

            const result = await response.json();
            console.log('✅ 存档保存成功:', result);
            alert(`✅ 存档已保存！\n\n文件: ${result.fileName}\n位置: saved_games/`);
            
        } catch (error) {
            console.error('Save game failed:', error);
            
            // 如果服务器不可用，回退到下载方式
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                alert('⚠️ 服务器未运行，将使用下载方式保存。\n\n请运行 npm start 启动服务器以启用自动保存功能。');
                await this.storageManager.saveGameToFile();
            } else {
                alert('保存游戏失败：' + error.message);
            }
        }
    }

    /**
     * 从文件加载游戏 - 支持从服务器加载
     */
    async loadGameFromFile() {
        try {
            console.log('Loading game from saved_games folder...');
            
            // 先尝试从服务器获取存档列表
            let saves = [];
            try {
                const response = await fetch('http://localhost:3001/api/saves');
                if (response.ok) {
                    const data = await response.json();
                    saves = data.saves || [];
                }
            } catch (e) {
                console.log('服务器不可用，使用文件选择方式');
            }

            if (saves.length > 0) {
                // 显示存档列表让用户选择
                const saveList = saves.slice(0, 10).map((s, i) => 
                    `${i + 1}. ${s.fileName}`
                ).join('\n');
                
                const choice = prompt(`📂 选择要加载的存档:\n\n${saveList}\n\n0. 从本地文件选择\n\n请输入编号:`);
                
                if (choice === null) return;
                
                const index = parseInt(choice) - 1;
                
                if (choice === '0' || isNaN(index) || index < 0 || index >= saves.length) {
                    // 使用传统文件选择方式
                    const saveData = await this.storageManager.loadGameFromFile();
                    await this.handleLoadedSave(saveData);
                    return;
                }

                // 从服务器加载选中的存档
                const selectedSave = saves[index];
                const loadResponse = await fetch(`http://localhost:3001/api/save/${selectedSave.fileName}`);
                
                if (!loadResponse.ok) {
                    throw new Error('加载存档失败');
                }

                const { saveData } = await loadResponse.json();
                await this.handleLoadedSave(saveData);
                
            } else {
                // 没有服务器存档，使用传统方式
                const saveData = await this.storageManager.loadGameFromFile();
                await this.handleLoadedSave(saveData);
            }
            
        } catch (error) {
            console.error('Load game from file failed:', error);
            if (error.message !== '未选择文件') {
                alert('加载存档失败：' + error.message);
            }
        }
    }

    /**
     * 处理加载的存档数据
     */
    async handleLoadedSave(saveData) {
        const confirmLoad = confirm(`确定要加载存档"${saveData.saveName}"吗？\n保存时间：${new Date(saveData.saveTime).toLocaleString()}\n\n当前游戏数据将被覆盖！`);
        if (!confirmLoad) return;
        
        this.storageManager.restoreAllGameData(saveData.gameData);
        alert('存档加载成功！页面将刷新以应用新数据。');
        window.location.reload();
    }

    /**
     * 销毁游戏会话
     */
    destroy() {
        try {
            this.dialogueSystem.destroy();
            this.imageSystem.destroy();
            
            this.gameState = 'initial';
            this.playerProfile = null;
            this.aiProfile = null;
            this.isInitialized = false;
            
            console.log('Game session destroyed');
        } catch (error) {
            console.error('Failed to destroy game session:', error);
        }
    }
}