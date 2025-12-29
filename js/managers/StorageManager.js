/**
 * 本地存储管理器
 * 负责游戏数据的保存和加载，支持localStorage和文件保存
 */

class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            PLAYER_PROFILE: 'ai_galgame_player_profile',
            AI_PROFILE: 'ai_galgame_ai_profile',
            DIALOGUE_HISTORY: 'ai_galgame_dialogue_history',
            GAME_STATE: 'ai_galgame_state',
            LAST_PLAY_TIME: 'ai_galgame_last_play_time',
            // 图像缓存相关
            CHARACTER_IMAGES: 'ai_galgame_character_images',
            BACKGROUND_IMAGES: 'ai_galgame_background_images',
            IMAGE_CACHE_VERSION: 'ai_galgame_image_cache_version'
        };
        
        // 图像缓存版本，用于清理过期缓存
        this.CACHE_VERSION = '1.0.0';
        
        // 文件保存相关
        this.SAVE_FOLDER = 'saved_games';
        this.SAVE_FILE_PREFIX = 'ai_galgame_save_';
    }

    /**
     * 清除所有缓存数据（包括localStorage和文件）
     */
    clearAllCache() {
        console.log('🧹 清除所有缓存数据...');
        
        // 清除localStorage中的所有游戏数据
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
            console.log(`✅ 已清除: ${key}`);
        });
        
        // 清除所有可能的游戏相关数据（更全面的清理）
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('ai_galgame') || key.includes('galgame') || key.includes('playkit'))) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`✅ 已清除额外缓存: ${key}`);
        });
        
        // 清除sessionStorage
        sessionStorage.clear();
        console.log('✅ 已清除sessionStorage');
        
        console.log('🎉 所有缓存已清除完毕！');
        
        // 刷新页面以确保完全重置
        if (confirm('缓存已清除！是否刷新页面以完全重置？')) {
            window.location.reload();
        }
    }

    /**
     * 保存游戏到文件
     * @param {string} saveName - 存档名称
     * @param {Object} gameData - 游戏数据
     */
    async saveGameToFile(saveName = null, gameData = null) {
        try {
            // 如果没有提供存档名称，使用时间戳
            if (!saveName) {
                const now = new Date();
                saveName = `存档_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}`;
            }
            
            // 如果没有提供游戏数据，收集当前数据
            if (!gameData) {
                gameData = this.collectAllGameData();
            }
            
            // 创建保存数据
            const saveData = {
                saveName: saveName,
                saveTime: new Date().toISOString(),
                version: '1.0.0',
                gameData: gameData
            };
            
            // 转换为JSON字符串
            const jsonString = JSON.stringify(saveData, null, 2);
            
            // 创建下载链接
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // 创建下载链接并触发下载
            const a = document.createElement('a');
            a.href = url;
            a.download = `${saveName}.json`;
            
            // 设置下载属性以建议保存位置
            a.setAttribute('download', `${saveName}.json`);
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('💾 游戏已保存到文件:', `${saveName}.json`);
            
            // 显示保存成功信息和说明
            const message = `游戏已保存成功！\n\n文件名: ${saveName}.json\n\n💡 小贴士:\n1. 文件已下载到浏览器的下载文件夹\n2. 建议将存档文件移动到游戏根目录的 saved_games 文件夹中\n3. 可以使用 saved_games 文件夹中的 move_saves.bat 脚本自动整理存档`;
            
            alert(message);
            
            return true;
            
        } catch (error) {
            console.error('保存游戏到文件失败:', error);
            throw new Error('保存游戏失败');
        }
    }

    /**
     * 从文件加载游戏
     * @returns {Promise<Object>} 游戏数据
     */
    async loadGameFromFile() {
        return new Promise((resolve, reject) => {
            try {
                // 创建文件输入元素
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                
                input.onchange = (event) => {
                    const file = event.target.files[0];
                    if (!file) {
                        reject(new Error('未选择文件'));
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const saveData = JSON.parse(e.target.result);
                            
                            // 验证存档格式
                            if (!saveData.gameData || !saveData.version) {
                                throw new Error('存档格式无效');
                            }
                            
                            console.log('📂 从文件加载游戏:', saveData.saveName);
                            resolve(saveData);
                            
                        } catch (parseError) {
                            reject(new Error('存档文件格式错误'));
                        }
                    };
                    
                    reader.onerror = () => {
                        reject(new Error('文件读取失败'));
                    };
                    
                    reader.readAsText(file);
                };
                
                input.click();
                
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 收集所有游戏数据
     * @returns {Object} 完整的游戏数据
     */
    collectAllGameData() {
        return {
            playerProfile: this.loadPlayerProfile(),
            aiProfile: this.loadAIProfile(),
            dialogueHistory: this.loadDialogueHistory(),
            gameState: this.loadGameState(),
            lastPlayTime: this.getLastPlayTime(),
            characterImages: this.loadCharacterImageCache(),
            backgroundImages: this.loadBackgroundImageCache(),
            cacheVersion: this.CACHE_VERSION
        };
    }

    /**
     * 恢复所有游戏数据
     * @param {Object} gameData - 游戏数据
     */
    restoreAllGameData(gameData) {
        try {
            console.log('🔄 恢复游戏数据...');
            
            // 恢复角色数据
            if (gameData.playerProfile) {
                localStorage.setItem(this.STORAGE_KEYS.PLAYER_PROFILE, JSON.stringify(gameData.playerProfile));
                console.log('✅ 玩家角色数据已恢复');
            }
            
            if (gameData.aiProfile) {
                localStorage.setItem(this.STORAGE_KEYS.AI_PROFILE, JSON.stringify(gameData.aiProfile));
                console.log('✅ AI角色数据已恢复');
            }
            
            // 恢复对话历史
            if (gameData.dialogueHistory) {
                localStorage.setItem(this.STORAGE_KEYS.DIALOGUE_HISTORY, JSON.stringify(gameData.dialogueHistory));
                console.log('✅ 对话历史已恢复');
            }
            
            // 恢复游戏状态
            if (gameData.gameState) {
                localStorage.setItem(this.STORAGE_KEYS.GAME_STATE, JSON.stringify(gameData.gameState));
            }
            
            if (gameData.lastPlayTime) {
                localStorage.setItem(this.STORAGE_KEYS.LAST_PLAY_TIME, gameData.lastPlayTime.toString());
            }
            
            // 恢复图像缓存
            if (gameData.characterImages) {
                localStorage.setItem(this.STORAGE_KEYS.CHARACTER_IMAGES, JSON.stringify(gameData.characterImages));
                console.log('✅ 角色图像缓存已恢复');
            }
            
            if (gameData.backgroundImages) {
                localStorage.setItem(this.STORAGE_KEYS.BACKGROUND_IMAGES, JSON.stringify(gameData.backgroundImages));
                console.log('✅ 背景图像缓存已恢复');
            }
            
            console.log('🎉 所有游戏数据恢复完成！');
            
        } catch (error) {
            console.error('恢复游戏数据失败:', error);
            throw new Error('恢复游戏数据失败');
        }
    }

    /**
     * 保存玩家角色设定
     * @param {CharacterProfile} profile - 玩家角色
     */
    savePlayerProfile(profile) {
        try {
            const data = profile.toJSON();
            localStorage.setItem(this.STORAGE_KEYS.PLAYER_PROFILE, JSON.stringify(data));
            console.log('Player profile saved successfully');
        } catch (error) {
            console.error('Failed to save player profile:', error);
            throw new Error('保存玩家角色失败');
        }
    }

    /**
     * 保存AI角色设定
     * @param {CharacterProfile} profile - AI角色
     */
    saveAIProfile(profile) {
        try {
            const data = profile.toJSON();
            localStorage.setItem(this.STORAGE_KEYS.AI_PROFILE, JSON.stringify(data));
            console.log('AI profile saved successfully');
        } catch (error) {
            console.error('Failed to save AI profile:', error);
            throw new Error('保存AI角色失败');
        }
    }

    /**
     * 保存对话历史
     * @param {Array} history - 对话历史数组
     */
    saveDialogueHistory(history) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.DIALOGUE_HISTORY, JSON.stringify(history));
            console.log('Dialogue history saved successfully');
        } catch (error) {
            console.error('Failed to save dialogue history:', error);
            throw new Error('保存对话历史失败');
        }
    }

    /**
     * 保存游戏状态
     * @param {Object|string} state - 游戏状态对象或字符串
     */
    saveGameState(state) {
        try {
            const stateData = typeof state === 'string' ? state : JSON.stringify(state);
            localStorage.setItem(this.STORAGE_KEYS.GAME_STATE, stateData);
            localStorage.setItem(this.STORAGE_KEYS.LAST_PLAY_TIME, Date.now().toString());
            console.log('Game state saved successfully');
        } catch (error) {
            console.error('Failed to save game state:', error);
            throw new Error('保存游戏状态失败');
        }
    }

    /**
     * 加载玩家角色设定
     * @returns {CharacterProfile|null} 玩家角色或null
     */
    loadPlayerProfile() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.PLAYER_PROFILE);
            if (!data) return null;
            
            const profileData = JSON.parse(data);
            return CharacterProfile.fromJSON(profileData);
        } catch (error) {
            console.error('Failed to load player profile:', error);
            return null;
        }
    }

    /**
     * 加载AI角色设定
     * @returns {CharacterProfile|null} AI角色或null
     */
    loadAIProfile() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.AI_PROFILE);
            if (!data) return null;
            
            const profileData = JSON.parse(data);
            return CharacterProfile.fromJSON(profileData);
        } catch (error) {
            console.error('Failed to load AI profile:', error);
            return null;
        }
    }

    /**
     * 加载对话历史
     * @returns {Array} 对话历史数组
     */
    loadDialogueHistory() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.DIALOGUE_HISTORY);
            if (!data) return [];
            
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to load dialogue history:', error);
            return [];
        }
    }

    /**
     * 加载游戏状态
     * @returns {Object|string|null} 游戏状态对象、字符串或null
     */
    loadGameState() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.GAME_STATE);
            if (!data) return null;
            
            // 尝试解析为JSON对象，如果失败则返回原始字符串
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        } catch (error) {
            console.error('Failed to load game state:', error);
            return null;
        }
    }

    /**
     * 获取上次游戏时间
     * @returns {number|null} 时间戳或null
     */
    getLastPlayTime() {
        try {
            const time = localStorage.getItem(this.STORAGE_KEYS.LAST_PLAY_TIME);
            return time ? parseInt(time) : null;
        } catch (error) {
            console.error('Failed to get last play time:', error);
            return null;
        }
    }

    /**
     * 检查是否有保存的游戏数据
     * @returns {boolean} 是否有保存数据
     */
    hasSavedGame() {
        const playerProfile = this.loadPlayerProfile();
        const aiProfile = this.loadAIProfile();
        return playerProfile !== null && aiProfile !== null;
    }

    /**
     * 加载完整的游戏数据
     * @returns {Object|null} 游戏数据对象或null
     */
    loadGameData() {
        try {
            const playerProfile = this.loadPlayerProfile();
            const aiProfile = this.loadAIProfile();
            const dialogueHistory = this.loadDialogueHistory();
            const gameState = this.loadGameState();
            const lastPlayTime = this.getLastPlayTime();

            if (!playerProfile || !aiProfile) {
                return null;
            }

            return {
                playerProfile,
                aiProfile,
                dialogueHistory,
                gameState,
                lastPlayTime
            };
        } catch (error) {
            console.error('Failed to load game data:', error);
            return null;
        }
    }

    /**
     * 清除玩家角色数据
     */
    clearPlayerProfile() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.PLAYER_PROFILE);
            console.log('Player profile cleared');
        } catch (error) {
            console.error('Failed to clear player profile:', error);
        }
    }

    /**
     * 清除AI角色数据
     */
    clearAIProfile() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.AI_PROFILE);
            console.log('AI profile cleared');
        } catch (error) {
            console.error('Failed to clear AI profile:', error);
        }
    }

    /**
     * 清除对话历史
     */
    clearDialogueHistory() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.DIALOGUE_HISTORY);
            console.log('Dialogue history cleared');
        } catch (error) {
            console.error('Failed to clear dialogue history:', error);
        }
    }

    /**
     * 清除游戏状态
     */
    clearGameState() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.GAME_STATE);
            localStorage.removeItem(this.STORAGE_KEYS.LAST_PLAY_TIME);
            console.log('Game state cleared');
        } catch (error) {
            console.error('Failed to clear game state:', error);
        }
    }

    /**
     * 清除所有游戏数据
     */
    clearAllGameData() {
        try {
            this.clearPlayerProfile();
            this.clearAIProfile();
            this.clearDialogueHistory();
            this.clearGameState();
            console.log('All game data cleared');
        } catch (error) {
            console.error('Failed to clear all game data:', error);
            throw new Error('清除游戏数据失败');
        }
    }

    /**
     * 检查本地存储是否可用
     * @returns {boolean} 是否可用
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('Local storage is not available:', error);
            return false;
        }
    }

    /**
     * 获取存储使用情况
     * @returns {Object} 存储使用信息
     */
    getStorageInfo() {
        if (!this.isStorageAvailable()) {
            return { available: false };
        }

        try {
            let totalSize = 0;
            let gameDataSize = 0;

            // 计算总存储大小
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length;
                    
                    // 计算游戏数据大小
                    if (Object.values(this.STORAGE_KEYS).includes(key)) {
                        gameDataSize += localStorage[key].length;
                    }
                }
            }

            return {
                available: true,
                totalSize,
                gameDataSize,
                itemCount: localStorage.length
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return { available: false };
        }
    }

    // ==================== 图像缓存管理 ====================

    /**
     * 生成角色图像的缓存键
     * @param {CharacterProfile} aiProfile - AI角色设定
     * @returns {string} 缓存键
     */
    generateCharacterImageKey(aiProfile) {
        // 基于角色的关键属性生成唯一键
        const keyData = {
            nickname: aiProfile.nickname,
            gender: aiProfile.gender,
            appearance: aiProfile.appearance,
            settings: aiProfile.settings
        };
        
        // 使用encodeURIComponent处理中文字符，然后生成哈希
        const jsonString = JSON.stringify(keyData);
        const encodedString = encodeURIComponent(jsonString);
        
        // 生成简单的哈希值
        let hash = 0;
        for (let i = 0; i < encodedString.length; i++) {
            const char = encodedString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        // 转换为正数并生成字符串
        const hashString = Math.abs(hash).toString(36);
        return 'char_' + hashString.substring(0, 16);
    }

    /**
     * 生成背景图像的缓存键
     * @param {string} sceneDescription - 场景描述
     * @returns {string} 缓存键
     */
    generateBackgroundImageKey(sceneDescription) {
        // 使用encodeURIComponent处理中文字符
        const encodedString = encodeURIComponent(sceneDescription);
        
        // 生成简单的哈希值
        let hash = 0;
        for (let i = 0; i < encodedString.length; i++) {
            const char = encodedString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        // 转换为正数并生成字符串
        const hashString = Math.abs(hash).toString(36);
        return 'bg_' + hashString.substring(0, 16);
    }

    /**
     * 保存角色图像到缓存
     * @param {CharacterProfile} aiProfile - AI角色设定
     * @param {string} imageUrl - 图像URL
     */
    async saveCharacterImage(aiProfile, imageUrl) {
        try {
            const key = this.generateCharacterImageKey(aiProfile);
            const cache = this.loadCharacterImageCache();
            
            // 压缩图像以减少存储大小
            const compressedUrl = await this.compressImage(imageUrl, 0.7);
            
            cache[key] = {
                imageUrl: compressedUrl,
                timestamp: Date.now(),
                profile: {
                    nickname: aiProfile.nickname,
                    appearance: aiProfile.appearance
                }
            };
            
            localStorage.setItem(this.STORAGE_KEYS.CHARACTER_IMAGES, JSON.stringify(cache));
            console.log('Character image cached with key:', key);
        } catch (error) {
            console.error('Failed to cache character image:', error);
            
            // 如果存储失败，尝试清理旧缓存
            if (error.name === 'QuotaExceededError') {
                console.log('Storage quota exceeded, cleaning up old cache...');
                this.cleanupImageCache(24 * 60 * 60 * 1000); // 清理1天前的缓存
                
                // 再次尝试保存
                try {
                    const compressedUrl = await this.compressImage(imageUrl, 0.5); // 更高压缩率
                    const cache = this.loadCharacterImageCache();
                    const key = this.generateCharacterImageKey(aiProfile);
                    
                    cache[key] = {
                        imageUrl: compressedUrl,
                        timestamp: Date.now(),
                        profile: {
                            nickname: aiProfile.nickname,
                            appearance: aiProfile.appearance
                        }
                    };
                    
                    localStorage.setItem(this.STORAGE_KEYS.CHARACTER_IMAGES, JSON.stringify(cache));
                    console.log('Character image cached after cleanup with key:', key);
                } catch (retryError) {
                    console.error('Failed to cache character image after cleanup:', retryError);
                }
            }
        }
    }

    /**
     * 从缓存加载角色图像
     * @param {CharacterProfile} aiProfile - AI角色设定
     * @returns {string|null} 图像URL或null
     */
    loadCharacterImage(aiProfile) {
        try {
            const key = this.generateCharacterImageKey(aiProfile);
            const cache = this.loadCharacterImageCache();
            
            if (cache[key]) {
                console.log('Character image found in cache:', key);
                return cache[key].imageUrl;
            }
            
            console.log('Character image not found in cache:', key);
            return null;
        } catch (error) {
            console.error('Failed to load cached character image:', error);
            return null;
        }
    }

    /**
     * 压缩图像以减少存储大小 - 优化版本，背景图像保持更高质量
     * @param {string} imageUrl - 原始图像URL
     * @param {number} quality - 压缩质量 (0.1-1.0)
     * @returns {Promise<string>} 压缩后的图像URL
     */
    async compressImage(imageUrl, quality = 0.7) {
        return new Promise((resolve) => {
            try {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // 对于背景图像，保持更大的尺寸以确保清晰度
                    const maxWidth = quality >= 0.95 ? 2048 : 1600; // 高质量时使用更大尺寸
                    const maxHeight = quality >= 0.95 ? 1536 : 1200;
                    let { width, height } = img;
                    
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width *= ratio;
                        height *= ratio;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // 设置高质量渲染
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // 绘制并压缩
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // 对于高质量背景图像，使用PNG格式保持更好的质量
                    const format = quality >= 0.95 ? 'image/png' : 'image/jpeg';
                    const compressedUrl = canvas.toDataURL(format, quality);
                    
                    console.log(`Image compressed: ${imageUrl.length} -> ${compressedUrl.length} bytes, quality: ${quality}, format: ${format}`);
                    resolve(compressedUrl);
                };
                
                img.onerror = () => {
                    console.warn('Image compression failed, using original');
                    resolve(imageUrl);
                };
                
                img.src = imageUrl;
            } catch (error) {
                console.warn('Image compression error:', error);
                resolve(imageUrl);
            }
        });
    }

    /**
     * 保存背景图像到缓存 - 优化版本，提高背景图像质量
     * @param {string} sceneDescription - 场景描述
     * @param {string} imageUrl - 图像URL
     */
    async saveBackgroundImage(sceneDescription, imageUrl) {
        try {
            const key = this.generateBackgroundImageKey(sceneDescription);
            const cache = this.loadBackgroundImageCache();
            
            // 背景图像使用最高质量压缩（0.98质量）- 提高清晰度
            const compressedUrl = await this.compressImage(imageUrl, 0.98);
            
            cache[key] = {
                imageUrl: compressedUrl,
                timestamp: Date.now(),
                sceneDescription: sceneDescription
            };
            
            localStorage.setItem(this.STORAGE_KEYS.BACKGROUND_IMAGES, JSON.stringify(cache));
            console.log('Background image cached with key:', key);
        } catch (error) {
            console.error('Failed to cache background image:', error);
            
            // 如果存储失败，尝试清理旧缓存
            if (error.name === 'QuotaExceededError') {
                console.log('Storage quota exceeded, cleaning up old cache...');
                this.cleanupImageCache(24 * 60 * 60 * 1000); // 清理1天前的缓存
                
                // 再次尝试保存 - 使用稍低质量但仍然很高的压缩率
                try {
                    const compressedUrl = await this.compressImage(imageUrl, 0.95);
                    const cache = this.loadBackgroundImageCache();
                    const key = this.generateBackgroundImageKey(sceneDescription);
                    
                    cache[key] = {
                        imageUrl: compressedUrl,
                        timestamp: Date.now(),
                        sceneDescription: sceneDescription
                    };
                    
                    localStorage.setItem(this.STORAGE_KEYS.BACKGROUND_IMAGES, JSON.stringify(cache));
                    console.log('Background image cached after cleanup with key:', key);
                } catch (retryError) {
                    console.error('Failed to cache background image after cleanup:', retryError);
                }
            }
        }
    }

    /**
     * 从缓存加载背景图像
     * @param {string} sceneDescription - 场景描述
     * @returns {string|null} 图像URL或null
     */
    loadBackgroundImage(sceneDescription) {
        try {
            const key = this.generateBackgroundImageKey(sceneDescription);
            const cache = this.loadBackgroundImageCache();
            
            if (cache[key]) {
                console.log('Background image found in cache:', key);
                return cache[key].imageUrl;
            }
            
            console.log('Background image not found in cache:', key);
            return null;
        } catch (error) {
            console.error('Failed to load cached background image:', error);
            return null;
        }
    }

    /**
     * 加载角色图像缓存
     * @returns {Object} 缓存对象
     */
    loadCharacterImageCache() {
        try {
            const cacheData = localStorage.getItem(this.STORAGE_KEYS.CHARACTER_IMAGES);
            return cacheData ? JSON.parse(cacheData) : {};
        } catch (error) {
            console.error('Failed to load character image cache:', error);
            return {};
        }
    }

    /**
     * 加载背景图像缓存
     * @returns {Object} 缓存对象
     */
    loadBackgroundImageCache() {
        try {
            const cacheData = localStorage.getItem(this.STORAGE_KEYS.BACKGROUND_IMAGES);
            return cacheData ? JSON.parse(cacheData) : {};
        } catch (error) {
            console.error('Failed to load background image cache:', error);
            return {};
        }
    }

    /**
     * 清理过期的图像缓存
     * @param {number} maxAge - 最大缓存时间（毫秒），默认7天
     */
    cleanupImageCache(maxAge = 7 * 24 * 60 * 60 * 1000) {
        try {
            const now = Date.now();
            
            // 清理角色图像缓存
            const characterCache = this.loadCharacterImageCache();
            let cleanedCharacter = false;
            for (const key in characterCache) {
                if (now - characterCache[key].timestamp > maxAge) {
                    delete characterCache[key];
                    cleanedCharacter = true;
                }
            }
            if (cleanedCharacter) {
                localStorage.setItem(this.STORAGE_KEYS.CHARACTER_IMAGES, JSON.stringify(characterCache));
            }
            
            // 清理背景图像缓存
            const backgroundCache = this.loadBackgroundImageCache();
            let cleanedBackground = false;
            for (const key in backgroundCache) {
                if (now - backgroundCache[key].timestamp > maxAge) {
                    delete backgroundCache[key];
                    cleanedBackground = true;
                }
            }
            if (cleanedBackground) {
                localStorage.setItem(this.STORAGE_KEYS.BACKGROUND_IMAGES, JSON.stringify(backgroundCache));
            }
            
            console.log('Image cache cleanup completed');
        } catch (error) {
            console.error('Failed to cleanup image cache:', error);
        }
    }

    /**
     * 获取缓存统计信息
     * @returns {Object} 缓存统计
     */
    getCacheStats() {
        try {
            const characterCache = this.loadCharacterImageCache();
            const backgroundCache = this.loadBackgroundImageCache();
            
            return {
                characterImages: Object.keys(characterCache).length,
                backgroundImages: Object.keys(backgroundCache).length,
                totalCached: Object.keys(characterCache).length + Object.keys(backgroundCache).length
            };
        } catch (error) {
            console.error('Failed to get cache stats:', error);
            return { characterImages: 0, backgroundImages: 0, totalCached: 0 };
        }
    }

    /**
     * 清空所有图像缓存
     */
    clearImageCache() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.CHARACTER_IMAGES);
            localStorage.removeItem(this.STORAGE_KEYS.BACKGROUND_IMAGES);
            console.log('All image cache cleared');
        } catch (error) {
            console.error('Failed to clear image cache:', error);
        }
    }

    /**
     * 清空角色图像缓存
     */
    clearCharacterImageCache() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.CHARACTER_IMAGES);
            console.log('Character image cache cleared');
        } catch (error) {
            console.error('Failed to clear character image cache:', error);
        }
    }

    /**
     * 清空背景图像缓存
     */
    clearBackgroundImageCache() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.BACKGROUND_IMAGES);
            console.log('Background image cache cleared');
        } catch (error) {
            console.error('Failed to clear background image cache:', error);
        }
    }
}