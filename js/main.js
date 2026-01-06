/**
 * AI Galgame 主程序
 */

class AIGalgame {
    constructor() {
        this.storageManager = new StorageManager();
        this.gameSessionManager = null;
        this.imageSystem = null;
        this.bgmSystem = new BGMSystem(); // BGM配乐系统
        this.gameState = 'initial';
        this.playerProfile = null;
        this.aiProfile = null;
        
        // DOM元素引用 - 延迟初始化
        this.elements = {};

        this.init();
    }

    /**
     * 初始化游戏
     */
    async init() {
        console.log('Initializing AI Galgame...');
        
        try {
            // 初始化DOM元素引用
            this.initializeElements();
            
            // 检查本地存储是否可用
            if (!this.storageManager.isStorageAvailable()) {
                alert('本地存储不可用，游戏数据将无法保存');
            }

            // 设置事件监听器
            this.setupEventListeners();

            // 显示主菜单（首次加载直接显示，无动画）
            this.showMainMenuDirect();

        } catch (error) {
            console.error('Failed to initialize game:', error);
            alert('游戏初始化失败，请刷新页面重试');
        }
    }

    /**
     * 直接显示主菜单（无动画，用于首次加载）
     */
    showMainMenuDirect() {
        if (this.elements.mainMenu) {
            this.elements.mainMenu.style.display = 'block';
            this.elements.mainMenu.classList.add('active');
        }
        this.gameState = 'main_menu';
        this.updateContinueButton();
        
        // 播放主菜单BGM
        this.bgmSystem.play('menu');
    }

    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        this.elements = {
            mainMenu: document.getElementById('main-menu'),
            characterSetup: document.getElementById('character-setup'),
            gameScreen: document.getElementById('game-main'),
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text')
        };
        
        console.log('Elements initialized:', this.elements);
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // 主菜单按钮事件监听器
        const btnNewGame = document.getElementById('btn-new-game');
        const btnContinueGame = document.getElementById('btn-continue-game');
        const btnLoadGame = document.getElementById('btn-load-game');
        const btnSaveGame = document.getElementById('btn-save-game');
        const btnManageSaves = document.getElementById('btn-manage-saves');
        const btnClearCache = document.getElementById('btn-clear-cache');
        const btnGameSettings = document.getElementById('btn-game-settings');
        const btnExitGame = document.getElementById('btn-exit-game');

        console.log('Main menu buttons found:', {
            newGame: !!btnNewGame,
            continueGame: !!btnContinueGame,
            loadGame: !!btnLoadGame,
            saveGame: !!btnSaveGame,
            manageSaves: !!btnManageSaves,
            clearCache: !!btnClearCache,
            settings: !!btnGameSettings,
            exit: !!btnExitGame
        });

        if (btnNewGame) {
            btnNewGame.addEventListener('click', () => {
                console.log('New game button clicked');
                this.startNewGame();
            });
        }
        if (btnContinueGame) {
            btnContinueGame.addEventListener('click', () => {
                console.log('Continue game button clicked');
                this.continueGame();
            });
        }
        if (btnLoadGame) {
            btnLoadGame.addEventListener('click', () => {
                console.log('Load game button clicked');
                this.loadGameFromFile();
            });
        }
        if (btnSaveGame) {
            btnSaveGame.addEventListener('click', () => {
                console.log('Save game button clicked');
                this.saveGameToFile();
            });
        }
        if (btnManageSaves) {
            btnManageSaves.addEventListener('click', () => {
                console.log('Manage saves button clicked');
                window.open('saved_games/index.html', '_blank');
            });
        }
        if (btnClearCache) {
            btnClearCache.addEventListener('click', () => {
                console.log('Clear cache button clicked');
                this.clearAllCache();
            });
        }
        if (btnGameSettings) {
            btnGameSettings.addEventListener('click', () => {
                console.log('Game settings button clicked');
                this.showGameSettings();
            });
        }
        if (btnExitGame) {
            btnExitGame.addEventListener('click', () => {
                console.log('Exit game button clicked');
                this.exitGame();
            });
        }

        // 角色创建表单事件
        this.setupCharacterCreationEvents();
    }

    /**
     * 设置角色创建相关事件
     */
    setupCharacterCreationEvents() {
        // 玩家角色表单
        const playerForm = document.getElementById('player-form');
        if (playerForm) {
            playerForm.addEventListener('submit', (e) => this.handlePlayerFormSubmit(e));
        }

        // AI角色表单
        const aiForm = document.getElementById('ai-form');
        if (aiForm) {
            aiForm.addEventListener('submit', (e) => this.handleAIFormSubmit(e));
        }

        // 返回按钮
        const backBtn = document.getElementById('back-to-step1');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showStep1());
        }

        // 性别选择按钮
        this.setupGenderSelection();

        // AI头像生成
        const aiAvatarGen = document.getElementById('ai-avatar-gen');
        if (aiAvatarGen) {
            aiAvatarGen.addEventListener('click', () => {
                // 检查是否已启用
                if (!aiAvatarGen.classList.contains('disabled')) {
                    this.generateAIImage();
                }
            });
        }

        // 实时验证
        this.setupRealTimeValidation();
    }

    /**
     * 设置性别选择功能
     */
    setupGenderSelection() {
        // 为所有性别按钮添加事件监听器（支持新旧两种class）
        document.querySelectorAll('.gender-btn, .setup-gender-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // 防止表单提交
                const group = e.target.parentElement;
                const hiddenInput = group.nextElementSibling;
                
                // 移除同组其他按钮的选中状态
                group.querySelectorAll('.gender-btn, .setup-gender-btn').forEach(b => b.classList.remove('selected'));
                
                // 选中当前按钮
                e.target.classList.add('selected');
                
                // 设置隐藏输入框的值
                if (hiddenInput && hiddenInput.type === 'hidden') {
                    hiddenInput.value = e.target.dataset.value;
                    // 触发change事件，让其他监听器知道值变了
                    hiddenInput.dispatchEvent(new Event('change'));
                }
            });
        });
    }

    /**
     * 设置实时验证
     */
    setupRealTimeValidation() {
        // 玩家表单字段
        const playerFields = ['player-nickname', 'player-gender', 'player-personality', 'player-identity', 'player-character', 'player-traits', 'player-background'];
        playerFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validatePlayerField(fieldId));
                field.addEventListener('input', () => this.clearFieldError(fieldId));
            }
        });

        // AI表单字段
        const aiFields = ['ai-nickname', 'ai-gender', 'ai-settings', 'ai-appearance', 'ai-opening'];
        aiFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateAIField(fieldId));
                field.addEventListener('input', () => this.clearFieldError(fieldId));
            }
        });

        // 监听外观描述和性别变化，启用/禁用生成按钮
        const aiAppearanceField = document.getElementById('ai-appearance');
        const aiGenderField = document.getElementById('ai-gender');
        const aiAvatarGen = document.getElementById('ai-avatar-gen');
        const genStatus = document.getElementById('gen-status');
        
        const updateGenerateStatus = () => {
            const hasAppearance = aiAppearanceField && aiAppearanceField.value.trim().length > 0;
            const hasGender = aiGenderField && aiGenderField.value !== '';
            
            if (aiAvatarGen && genStatus) {
                if (hasGender && hasAppearance) {
                    aiAvatarGen.classList.remove('disabled');
                    genStatus.textContent = '点击生成';
                    genStatus.classList.add('ready');
                    
                    // 更新提示文字
                    const genTips = document.querySelector('.gen-tips');
                    if (genTips) {
                        genTips.innerHTML = '<strong>点击生成AI形象</strong><br>信息已填写完整，<br>点击此区域预览AI角色';
                    }
                } else if (hasGender && !hasAppearance) {
                    aiAvatarGen.classList.add('disabled');
                    genStatus.textContent = '需要外观描述';
                    genStatus.classList.remove('ready');
                } else if (!hasGender && hasAppearance) {
                    aiAvatarGen.classList.add('disabled');
                    genStatus.textContent = '需要选择性别';
                    genStatus.classList.remove('ready');
                } else {
                    aiAvatarGen.classList.add('disabled');
                    genStatus.textContent = '需要填写信息';
                    genStatus.classList.remove('ready');
                }
            }
        };
        
        if (aiAppearanceField) {
            aiAppearanceField.addEventListener('input', updateGenerateStatus);
        }
        if (aiGenderField) {
            aiGenderField.addEventListener('change', updateGenerateStatus);
        }
        
        // 初始化状态
        updateGenerateStatus();
    }

    /**
     * 验证玩家表单字段
     */
    validatePlayerField(fieldId) {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        const fieldName = fieldId.replace('player-', '');
        let errorMessage = '';

        switch (fieldName) {
            case 'nickname':
                if (!value) errorMessage = '请输入昵称';
                else if (value.length > 20) errorMessage = '昵称不能超过20个字符';
                break;
            case 'gender':
                if (!value) errorMessage = '请选择性别';
                break;
            case 'personality':
                if (!value) errorMessage = '请描述人设';
                else if (value.length > 200) errorMessage = '人设描述不能超过200个字符';
                break;
            case 'identity':
                if (!value) errorMessage = '请输入身份';
                else if (value.length > 50) errorMessage = '身份描述不能超过50个字符';
                break;
            case 'character':
                if (!value) errorMessage = '请描述性格';
                else if (value.length > 50) errorMessage = '性格描述不能超过50个字符';
                break;
            case 'traits':
                if (!value) errorMessage = '请描述特质';
                else if (value.length > 50) errorMessage = '特质描述不能超过50个字符';
                break;
            case 'background':
                if (!value) errorMessage = '请描述世界观';
                else if (value.length > 300) errorMessage = '世界观描述不能超过300个字符';
                break;
        }

        this.showFieldError(fieldId, errorMessage);
        return !errorMessage;
    }

    /**
     * 验证AI表单字段
     */
    validateAIField(fieldId) {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        const fieldName = fieldId.replace('ai-', '');
        let errorMessage = '';

        switch (fieldName) {
            case 'nickname':
                if (!value) errorMessage = '请输入AI昵称';
                else if (value.length > 20) errorMessage = '昵称不能超过20个字符';
                break;
            case 'gender':
                if (!value) errorMessage = '请选择性别';
                break;
            case 'settings':
                if (!value) errorMessage = '请描述AI角色设定';
                else if (value.length > 500) errorMessage = '设定描述不能超过500个字符';
                break;
            case 'appearance':
                if (!value) errorMessage = '请描述外观特征';
                else if (value.length > 300) errorMessage = '外观描述不能超过300个字符';
                break;
            case 'opening':
                if (!value) errorMessage = '请输入开场白';
                else if (value.length > 200) errorMessage = '开场白不能超过200个字符';
                break;
        }

        this.showFieldError(fieldId, errorMessage);
        return !errorMessage;
    }

    /**
     * 显示字段错误
     */
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId.replace(/^(player-|ai-)/, '') + '-error');
        
        if (message) {
            field.classList.add('error');
            if (errorElement) {
                errorElement.textContent = message;
                errorElement.classList.add('show');
            }
        } else {
            field.classList.remove('error');
            if (errorElement) {
                errorElement.classList.remove('show');
            }
        }
    }

    /**
     * 清除字段错误
     */
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId.replace(/^(player-|ai-)/, '') + '-error');
        
        field.classList.remove('error');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    /**
     * 处理玩家表单提交
     */
    async handlePlayerFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // 验证数据
        const validation = CharacterProfile.validatePlayerProfile(data);
        if (!validation.isValid) {
            this.showValidationErrors('player', validation.errors);
            return;
        }

        try {
            // 创建玩家角色
            this.playerProfile = CharacterProfile.createPlayerProfile(data);
            
            // 保存到本地存储
            this.storageManager.savePlayerProfile(this.playerProfile);
            
            // 切换到AI角色设置
            this.showStep2();
            
        } catch (error) {
            console.error('Failed to create player profile:', error);
            alert('创建角色失败，请重试');
        }
    }

    /**
     * 处理AI表单提交
     */
    async handleAIFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // 验证数据
        const validation = CharacterProfile.validateAIProfile(data);
        if (!validation.isValid) {
            this.showValidationErrors('ai', validation.errors);
            return;
        }

        try {
            this.showLoading('正在创建AI角色...');
            
            // 创建AI角色
            this.aiProfile = CharacterProfile.createAIProfile(data);
            
            // 保存到本地存储
            this.storageManager.saveAIProfile(this.aiProfile);
            
            // 保存完整的游戏状态
            const gameState = {
                gameState: 'gameplay',
                playerProfile: this.playerProfile,
                aiProfile: this.aiProfile,
                chatHistory: [],
                timestamp: Date.now()
            };
            this.storageManager.saveGameState(gameState);
            
            // 开始游戏
            await this.startGame();
            
        } catch (error) {
            console.error('Failed to create AI profile:', error);
            alert('创建AI角色失败，请重试');
            this.hideLoading();
        }
    }

    /**
     * 显示验证错误
     */
    showValidationErrors(formType, errors) {
        Object.keys(errors).forEach(field => {
            const fieldId = `${formType}-${field}`;
            this.showFieldError(fieldId, errors[field]);
        });
    }

    /**
     * 显示继续游戏对话框
     */
    async showContinueGameDialog() {
        const gameData = this.storageManager.loadGameData();
        if (!gameData) {
            this.showPlayerSetup();
            return;
        }

        const lastPlayTime = new Date(gameData.lastPlayTime);
        const timeString = lastPlayTime.toLocaleString();
        
        const shouldContinue = confirm(`检测到保存的游戏数据（${timeString}）\n是否继续之前的游戏？\n\n点击"确定"继续游戏，点击"取消"开始新游戏`);
        
        if (shouldContinue) {
            await this.loadSavedGame(gameData);
        } else {
            this.storageManager.clearAllGameData();
            this.showPlayerSetup();
        }
    }

    /**
     * 加载保存的游戏
     */
    async loadSavedGame(gameData) {
        try {
            this.showLoading('正在加载游戏...');
            
            // 确保角色数据是正确的CharacterProfile实例
            if (gameData.playerProfile) {
                this.playerProfile = CharacterProfile.fromJSON(gameData.playerProfile);
            }
            if (gameData.aiProfile) {
                this.aiProfile = CharacterProfile.fromJSON(gameData.aiProfile);
            }
            
            // 检查gameState的格式，支持多种格式
            let gameState = 'gameplay'; // 默认状态
            
            if (gameData.gameState) {
                if (typeof gameData.gameState === 'string') {
                    gameState = gameData.gameState;
                } else if (typeof gameData.gameState === 'object' && gameData.gameState.gameState) {
                    // 如果gameState是对象，提取其中的gameState字段
                    gameState = gameData.gameState.gameState;
                } else {
                    // 如果有playerProfile和aiProfile，说明游戏已经开始，设为gameplay
                    gameState = 'gameplay';
                }
            }
            
            console.log('Loading game with state:', gameState);
            console.log('Player profile:', this.playerProfile?.nickname);
            console.log('AI profile:', this.aiProfile?.nickname);
            
            if (gameState === 'gameplay' && this.playerProfile && this.aiProfile) {
                await this.startGame();
            } else if (gameState === 'ai_setup') {
                this.showAISetup();
                this.hideLoading();
            } else {
                this.showPlayerSetup();
                this.hideLoading();
            }
            
        } catch (error) {
            console.error('Failed to load saved game:', error);
            alert('加载游戏失败：' + error.message);
            this.storageManager.clearAllGameData();
            this.showPlayerSetup();
            this.hideLoading();
        }
    }

    /**
     * 开始游戏
     */
    async startGame() {
        try {
            this.showLoading('正在初始化游戏...');
            
            // 显示游戏主界面
            this.showGameScreen();
            
            // 切换到日常BGM
            this.bgmSystem.play('daily');
            
            // 创建并初始化游戏会话管理器（传递已初始化的图像系统）
            this.gameSessionManager = new GameSessionManager(this.imageSystem);
            this.gameSessionManager.bgmSystem = this.bgmSystem; // 传递BGM系统引用
            await this.gameSessionManager.initialize(this.playerProfile, this.aiProfile);
            
            this.hideLoading();
            
            console.log('Game started successfully with profiles:', {
                player: this.playerProfile.nickname,
                ai: this.aiProfile.nickname
            });
            
        } catch (error) {
            console.error('Failed to start game:', error);
            alert('启动游戏失败：' + error.message);
            this.hideLoading();
        }
    }

    /**
     * 开始新游戏
     */
    startNewGame() {
        console.log('Starting new game...');
        this.showCharacterSetup();
    }

    /**
     * 显示主菜单
     */
    showMainMenu() {
        console.log('Showing main menu...');
        
        this.fadeOutAllScreens(() => {
            if (this.elements.mainMenu) {
                this.elements.mainMenu.style.display = 'block';
                // 强制重绘
                this.elements.mainMenu.offsetHeight;
                this.elements.mainMenu.classList.add('active');
            }
            
            this.gameState = 'main_menu';
            
            // 检查是否有存档来启用/禁用继续游戏按钮
            this.updateContinueButton();
        });
    }

    /**
     * 更新继续游戏按钮状态
     */
    updateContinueButton() {
        const btnContinueGame = document.getElementById('btn-continue-game');
        if (btnContinueGame) {
            const hasLocalSave = this.storageManager.hasSavedGame();
            const fileSaves = JSON.parse(localStorage.getItem('ai_galgame_file_saves') || '[]');
            const hasFileSaves = fileSaves.length > 0;
            const hasAnySave = hasLocalSave || hasFileSaves;
            
            btnContinueGame.disabled = !hasAnySave;
            
            if (hasLocalSave) {
                btnContinueGame.title = '继续上次的游戏';
            } else if (hasFileSaves) {
                btnContinueGame.title = '从存档管理中选择存档继续游戏';
            } else {
                btnContinueGame.title = '没有可用的存档';
            }
        }
    }

    /**
     * 继续游戏
     */
    continueGame() {
        console.log('Continuing game...');
        
        try {
            // 检查是否有localStorage中的游戏数据
            const hasLocalData = this.storageManager.hasSavedGame();
            console.log('Has local data:', hasLocalData);
            
            if (hasLocalData) {
                // 如果有本地数据，直接加载
                const gameData = this.storageManager.loadGameData();
                console.log('Loaded game data:', gameData);
                
                if (gameData) {
                    this.loadSavedGame(gameData);
                    return;
                } else {
                    console.log('Game data is null, redirecting to save manager');
                }
            }
            
            // 如果没有本地数据，跳转到存档管理界面
            console.log('No local save data found, redirecting to save manager...');
            
            const message = '没有找到本地存档数据。\n\n将为您打开存档管理界面，您可以：\n1. 从文件加载之前保存的存档\n2. 查看和管理所有存档文件\n\n点击确定继续...';
            
            if (confirm(message)) {
                window.open('saved_games/index.html', '_blank');
            }
            
        } catch (error) {
            console.error('Continue game error:', error);
            alert('继续游戏时发生错误：' + error.message);
        }
    }

    /**
     * 清除所有缓存
     */
    clearAllCache() {
        console.log('Clearing all cache...');
        this.storageManager.clearAllCache();
    }

    /**
     * 保存游戏到文件
     */
    async saveGameToFile() {
        try {
            console.log('Saving game to file...');
            
            // 检查是否有游戏数据
            const hasGameData = this.storageManager.hasSavedGame();
            if (!hasGameData) {
                alert('没有可保存的游戏数据，请先开始游戏！');
                return;
            }
            
            // 获取存档名称
            const saveName = prompt('请输入存档名称（留空使用默认名称）:');
            if (saveName === null) return; // 用户取消
            
            await this.storageManager.saveGameToFile(saveName || undefined);
            alert('游戏已成功保存到文件！');
            
        } catch (error) {
            console.error('Save game to file failed:', error);
            alert('保存游戏失败：' + error.message);
        }
    }

    /**
     * 从文件加载游戏
     */
    async loadGameFromFile() {
        try {
            console.log('Loading game from file...');
            
            const saveData = await this.storageManager.loadGameFromFile();
            
            // 确认是否要加载存档
            const confirmLoad = confirm(`确定要加载存档"${saveData.saveName}"吗？\n保存时间：${new Date(saveData.saveTime).toLocaleString()}\n\n当前游戏数据将被覆盖！`);
            if (!confirmLoad) return;
            
            // 恢复游戏数据
            this.storageManager.restoreAllGameData(saveData.gameData);
            
            // 重新加载游戏
            alert('存档加载成功！页面将刷新以应用新数据。');
            window.location.reload();
            
        } catch (error) {
            console.error('Load game from file failed:', error);
            if (error.message !== '未选择文件') {
                alert('加载存档失败：' + error.message);
            }
        }
    }

    /**
     * 显示读取存档对话框
     */
    showLoadGameDialog() {
        console.log('Showing load game dialog...');
        this.loadGameFromFile();
    }

    /**
     * 显示游戏设定
     */
    showGameSettings() {
        console.log('Showing game settings...');
        alert('游戏设定功能开发中...');
    }

    /**
     * 退出游戏
     */
    exitGame() {
        if (confirm('确定要退出游戏吗？')) {
            console.log('Exiting game...');
            if (window.close) {
                window.close();
            } else {
                alert('请手动关闭浏览器标签页');
            }
        }
    }

    /**
     * 显示角色创建界面
     */
    showCharacterSetup() {
        this.fadeOutAllScreens(() => {
            if (this.elements.characterSetup) {
                this.elements.characterSetup.style.display = 'flex';
                // 强制重绘
                this.elements.characterSetup.offsetHeight;
                this.elements.characterSetup.classList.add('active');
            }
            
            this.showStep1();
            this.gameState = 'character_setup';
        });
    }

    /**
     * 显示第一步（玩家角色创建）
     */
    showStep1() {
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const progressBar = document.getElementById('p-bar');
        const stepInfo = document.getElementById('step-info');
        
        if (step1) step1.classList.add('active');
        if (step2) step2.classList.remove('active');
        if (progressBar) progressBar.style.width = '50%';
        if (stepInfo) stepInfo.innerText = 'STEP 01: 用户身份登记';
    }

    /**
     * 显示第二步（AI角色创建）
     */
    showStep2() {
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const progressBar = document.getElementById('p-bar');
        const stepInfo = document.getElementById('step-info');
        
        if (step1) step1.classList.remove('active');
        if (step2) step2.classList.add('active');
        if (progressBar) progressBar.style.width = '100%';
        if (stepInfo) stepInfo.innerText = 'STEP 02: 配置 AI 代理';
        window.scrollTo(0, 0);
    }

    /**
     * 显示游戏界面
     */
    showGameScreen() {
        console.log('Showing game screen...');
        
        // 先淡出当前页面
        this.fadeOutAllScreens(() => {
            if (this.elements.gameScreen) {
                this.elements.gameScreen.style.display = 'block';
                // 强制重绘
                this.elements.gameScreen.offsetHeight;
                this.elements.gameScreen.classList.add('active');
                
                // 强制显示默认背景
                const gameBackground = this.elements.gameScreen.querySelector('.game-background');
                if (gameBackground) {
                    gameBackground.style.display = 'block';
                    gameBackground.style.background = 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)';
                }
                
                // 确保UI层显示
                const uiLayer = this.elements.gameScreen.querySelector('.ui-layer');
                if (uiLayer) {
                    uiLayer.style.display = 'block';
                }
            }
            
            this.gameState = 'gameplay';
        });
    }

    /**
     * 淡出所有界面然后执行回调
     */
    fadeOutAllScreens(callback) {
        const screens = [this.elements.mainMenu, this.elements.characterSetup, this.elements.gameScreen];
        const activeScreens = screens.filter(s => s && s.classList.contains('active'));
        
        if (activeScreens.length === 0) {
            callback();
            return;
        }
        
        // 添加淡出效果
        activeScreens.forEach(screen => {
            screen.classList.add('fade-out');
        });
        
        // 等待动画完成后隐藏并执行回调
        setTimeout(() => {
            activeScreens.forEach(screen => {
                screen.classList.remove('active', 'fade-out');
                screen.style.display = 'none';
            });
            callback();
        }, 400);
    }

    /**
     * 隐藏所有界面（立即隐藏，无动画）
     */
    hideAllScreens() {
        console.log('Hiding all screens...');
        
        if (this.elements.mainMenu) {
            this.elements.mainMenu.classList.remove('active', 'fade-out');
            this.elements.mainMenu.style.display = 'none';
        }
        
        if (this.elements.characterSetup) {
            this.elements.characterSetup.classList.remove('active', 'fade-out');
            this.elements.characterSetup.style.display = 'none';
        }
        
        if (this.elements.gameScreen) {
            this.elements.gameScreen.classList.remove('active', 'fade-out');
            this.elements.gameScreen.style.display = 'none';
        }
    }

    /**
     * 显示加载界面
     */
    showLoading(text = '加载中...') {
        this.elements.loadingText.textContent = text;
        this.elements.loadingOverlay.style.display = 'flex';
    }

    /**
     * 隐藏加载界面
     */
    hideLoading() {
        this.elements.loadingOverlay.style.display = 'none';
    }

    /**
     * 生成AI形象
     */
    async generateAIImage() {
        const appearanceField = document.getElementById('ai-appearance');
        const genderField = document.getElementById('ai-gender');
        const appearance = appearanceField.value.trim();
        const gender = genderField.value;

        if (!appearance) {
            alert('请先填写外观描述');
            return;
        }

        if (!gender) {
            alert('请先选择性别');
            return;
        }

        try {
            // 显示加载状态
            this.showAIImageLoading();

            // 创建临时的AI角色数据用于生成图像
            const tempAIData = {
                nickname: 'PreviewCharacter',
                gender: gender,
                settings: '这是一个用于图像预览的临时角色设定',
                appearance: appearance,
                opening: '你好，这是预览图像！'
            };

            // 验证数据
            const validation = CharacterProfile.validateAIProfile(tempAIData);
            if (!validation.isValid) {
                console.error('Validation errors:', validation.errors);
                console.error('Temp AI data:', tempAIData);
                
                // 显示具体的验证错误
                const errorMessages = Object.values(validation.errors).join(', ');
                throw new Error(`角色数据验证失败: ${errorMessages}`);
            }

            const tempAIProfile = CharacterProfile.createAIProfile(tempAIData);

            // 初始化图像生成系统（如果还没有初始化）
            if (!this.imageSystem) {
                console.log('Initializing image generation system...');
                
                // 检查PlayKit SDK是否可用
                if (typeof PlayKitSDK === 'undefined') {
                    throw new Error('PlayKit SDK未加载，请刷新页面重试');
                }
                
                this.imageSystem = new ImageGenerationSystem(this.storageManager);
                await this.imageSystem.initialize({
                    gameId: 'your-game-id',
                    developerToken: 'your-developer-token',
                    baseURL: 'https://lab-staging.playkit.ai',
                    defaultChatModel: 'Qwen3-235B',
                    defaultImageModel: 'gpt-image-1',
                    debug: true
                });
                console.log('Image generation system initialized successfully');
            }

            // 生成图像
            const imageUrl = await this.imageSystem.generateInitialCharacterImage(tempAIProfile);
            
            console.log('🔍 Main.js received imageUrl length:', imageUrl ? imageUrl.length : 'null');
            
            // 显示生成的图像
            this.showAIPreviewImage(imageUrl);

        } catch (error) {
            console.error('Failed to generate AI image:', error);
            let errorMessage = '图像生成失败';
            
            if (error.message.includes('PlayKit SDK未加载')) {
                errorMessage = 'SDK未加载，请刷新页面重试';
            } else if (error.message.includes('credits') || error.message.includes('balance')) {
                errorMessage = '积分不足，无法生成图像';
            } else if (error.message.includes('network') || error.message.includes('API') || error.message.includes('404')) {
                errorMessage = '网络连接失败，请检查网络后重试';
            } else if (error.message.includes('验证失败') || error.message.includes('Invalid')) {
                errorMessage = '请确保已填写性别和外观描述';
            } else if (error.message.includes('Image generation failed')) {
                errorMessage = 'API调用失败，请检查网络连接和配置';
            } else {
                errorMessage = '图像生成失败：' + error.message;
            }
            
            this.showAIImageError(errorMessage);
        }
    }

    /**
     * 显示AI图像加载状态
     */
    showAIImageLoading() {
        const placeholder = document.getElementById('ai-image-placeholder');
        const previewImage = document.getElementById('ai-preview-image');
        const loading = document.getElementById('ai-image-loading');

        placeholder.style.display = 'none';
        previewImage.style.display = 'none';
        loading.style.display = 'flex';
    }

    /**
     * 显示AI预览图像
     */
    showAIPreviewImage(imageUrl) {
        const placeholder = document.getElementById('ai-image-placeholder');
        const previewImage = document.getElementById('ai-preview-image');
        const loading = document.getElementById('ai-image-loading');

        console.log('showAIPreviewImage called with URL:', imageUrl);
        console.log('URL length:', imageUrl ? imageUrl.length : 'null');
        console.log('URL starts with data:', imageUrl ? imageUrl.startsWith('data:') : 'null');
        console.log('URL first 100 chars:', imageUrl ? imageUrl.substring(0, 100) : 'null');
        
        // 检查并修复重复的data URL前缀
        if (imageUrl && imageUrl.includes('data:image/png;base64,data:image/png;base64,')) {
            console.warn('🔧 检测到重复的data URL前缀，正在修复...');
            imageUrl = imageUrl.replace(/^data:image\/png;base64,data:image\/png;base64,/, 'data:image/png;base64,');
        }
        
        // 检查其他类型的重复前缀
        if (imageUrl && /^data:[^,]*,data:/.test(imageUrl)) {
            console.warn('🔧 检测到其他类型的重复前缀，正在修复...');
            imageUrl = imageUrl.replace(/^data:[^,]*,data:/, 'data:');
        }

        // 验证URL格式
        if (!imageUrl || (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http'))) {
            console.error('Invalid image URL format in showAIPreviewImage:', imageUrl);
            this.showAIImageError('图像URL格式无效');
            return;
        }

        placeholder.style.display = 'none';
        loading.style.display = 'none';
        previewImage.src = imageUrl;
        previewImage.style.display = 'block';
        
        // 添加图像加载事件监听
        previewImage.onload = () => {
            console.log('✅ 图像加载成功');
        };
        
        previewImage.onerror = (error) => {
            console.error('❌ 图像加载失败:', error);
            console.error('失败的URL:', imageUrl);
            this.showAIImageError('图像加载失败，URL格式可能有问题');
        };
    }

    /**
     * 显示AI图像错误
     */
    showAIImageError(errorMessage) {
        const placeholder = document.getElementById('ai-image-placeholder');
        const previewImage = document.getElementById('ai-preview-image');
        const loading = document.getElementById('ai-image-loading');

        previewImage.style.display = 'none';
        loading.style.display = 'none';
        
        placeholder.innerHTML = `
            <div class="placeholder-icon">❌</div>
            <p>${errorMessage}</p>
        `;
        placeholder.style.display = 'block';
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    console.log('AIGalgame class available:', typeof AIGalgame);
    
    try {
        window.game = new AIGalgame();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game:', error);
        console.error('Error stack:', error.stack);
    }
});