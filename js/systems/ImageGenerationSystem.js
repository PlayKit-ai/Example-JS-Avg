/**
 * 图像生成系统
 * 负责生成AI角色图像和场景背景
 */

class ImageGenerationSystem {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.sdk = null;
        this.imageClient = null;
        this.isInitialized = false;
        this.generatedImages = [];
        this.currentCharacterImage = null;
    }

    /**
     * 从生成的图像对象中提取有效的URL
     * @param {Object} generatedImage - 生成的图像对象
     * @returns {string} 图像URL
     */
    extractImageUrl(generatedImage) {
        console.log('🔍 extractImageUrl called with:', generatedImage);
        
        let imageUrl = null;
        
        // 方法1: 使用 toDataURL
        if (typeof generatedImage.toDataURL === 'function') {
            imageUrl = generatedImage.toDataURL();
            console.log('✅ Using toDataURL method, URL length:', imageUrl.length);
            console.log('📋 toDataURL first 50 chars:', imageUrl.substring(0, 50));
        }
        // 方法2: 使用 base64 属性
        else if (generatedImage.base64) {
            console.log('📋 Raw base64 starts with data:', generatedImage.base64.startsWith('data:'));
            
            // 检查base64是否已经是完整的Data URL
            if (generatedImage.base64.startsWith('data:')) {
                imageUrl = generatedImage.base64;
                console.log('✅ Using base64 as complete Data URL, length:', imageUrl.length);
            } else {
                imageUrl = `data:image/png;base64,${generatedImage.base64}`;
                console.log('✅ Constructing Data URL from base64, length:', imageUrl.length);
            }
        }
        // 方法3: 直接使用 url 属性
        else if (generatedImage.url) {
            imageUrl = generatedImage.url;
            console.log('✅ Using url property:', imageUrl);
        }
        else {
            console.error('❌ No valid image URL method found');
            throw new Error('No valid image URL method found');
        }
        
        // 修复重复的data URL前缀问题
        if (imageUrl && imageUrl.includes('data:image/png;base64,data:image/png;base64,')) {
            console.warn('🔧 ImageSystem: 检测到重复的data URL前缀，正在修复...');
            imageUrl = imageUrl.replace(/^data:image\/png;base64,data:image\/png;base64,/, 'data:image/png;base64,');
        }
        
        // 检查其他类型的重复前缀
        if (imageUrl && /^data:[^,]*,data:/.test(imageUrl)) {
            console.warn('🔧 ImageSystem: 检测到其他类型的重复前缀，正在修复...');
            imageUrl = imageUrl.replace(/^data:[^,]*,data:/, 'data:');
        }
        
        // 验证URL格式
        if (!imageUrl || (!imageUrl.startsWith('data:') && !imageUrl.startsWith('http'))) {
            console.error('❌ Invalid image URL format:', imageUrl ? imageUrl.substring(0, 100) : 'null');
            throw new Error(`Invalid image URL format: ${imageUrl ? imageUrl.substring(0, 100) : 'null'}`);
        }
        
        console.log('✅ Final URL validation passed, returning URL with length:', imageUrl.length);
        
        return imageUrl;
    }

    /**
     * 初始化图像生成系统
     * @param {Object} sdkConfig - PlayKit SDK配置
     */
    async initialize(sdkConfig) {
        try {
            console.log('Initializing image generation system...');
            
            // 初始化PlayKit SDK（如果还没有初始化）
            if (!this.sdk) {
                // 检查PlayKitSDK是否可用
                if (typeof PlayKitSDK === 'undefined') {
                    throw new Error('PlayKit SDK未加载，请检查网络连接');
                }
                
                console.log('Initializing PlayKit SDK with config:', sdkConfig);
                this.sdk = new PlayKitSDK.PlayKitSDK(sdkConfig);
                await this.sdk.initialize();
                console.log('PlayKit SDK initialized successfully');
            }
            
            // 创建图像生成客户端
            this.imageClient = this.sdk.createImageClient(sdkConfig.defaultImageModel || 'gpt-image-1');
            
            this.isInitialized = true;
            console.log('Image generation system initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize image generation system:', error);
            throw new Error('图像生成系统初始化失败');
        }
    }

    /**
     * 设置SDK实例（如果已经在其他地方初始化）
     * @param {PlayKitSDK} sdk - SDK实例
     */
    setSDK(sdk, modelName = 'gpt-image-1') {
        this.sdk = sdk;
        this.imageClient = sdk.createImageClient(modelName);
        this.isInitialized = true;
    }

    /**
     * 生成AI角色的初始图像
     * @param {CharacterProfile} aiProfile - AI角色设定
     * @returns {Promise<string>} 图像URL
     */
    async generateInitialCharacterImage(aiProfile) {
        if (!this.isInitialized) {
            throw new Error('图像生成系统未初始化');
        }

        try {
            console.log('Generating initial character image...');
            
            // 首先检查缓存
            const cachedImageUrl = this.storageManager.loadCharacterImage(aiProfile);
            if (cachedImageUrl) {
                console.log('Using cached character image');
                
                // 保存生成的图像信息
                const imageInfo = {
                    id: Date.now(),
                    type: 'character_initial',
                    prompt: 'cached',
                    url: cachedImageUrl,
                    timestamp: Date.now(),
                    aiProfile: aiProfile.nickname,
                    cached: true
                };
                
                this.generatedImages.push(imageInfo);
                this.currentCharacterImage = imageInfo;
                
                return cachedImageUrl;
            }
            
            // 生成图像提示词
            const prompt = aiProfile.generateImagePrompt();
            console.log('Image prompt:', prompt);
            
            // 生成图像 - 通过提示词实现透明背景
            const generatedImage = await this.imageClient.generateImage({
                prompt: prompt,
                size: '1024x1024'
            });
            
            console.log('Generated image object:', generatedImage);
            console.log('Generated image type:', typeof generatedImage);
            console.log('Generated image keys:', Object.keys(generatedImage));
            
            // 获取图像URL
            const imageUrl = this.extractImageUrl(generatedImage);
            
            // 保存到缓存
            await this.storageManager.saveCharacterImage(aiProfile, imageUrl);
            
            // 保存生成的图像信息
            const imageInfo = {
                id: Date.now(),
                type: 'character_initial',
                prompt: prompt,
                url: imageUrl,
                timestamp: Date.now(),
                aiProfile: aiProfile.nickname
            };
            
            this.generatedImages.push(imageInfo);
            this.currentCharacterImage = imageInfo;
            
            console.log('Initial character image generated successfully');
            return imageInfo.url;
            
        } catch (error) {
            console.error('Failed to generate initial character image:', error);
            
            if (error.message.includes('credits') || error.message.includes('balance')) {
                throw new Error('积分不足，无法生成图像');
            } else if (error.message.includes('network') || error.message.includes('API')) {
                throw new Error('网络连接失败，图像生成失败');
            } else {
                throw new Error('图像生成失败，请重试');
            }
        }
    }

    /**
     * 基于对话情境生成角色图像
     * @param {CharacterProfile} aiProfile - AI角色设定
     * @param {string} emotion - 情绪描述
     * @param {string} context - 对话情境
     * @returns {Promise<string>} 图像URL
     */
    async generateContextualCharacterImage(aiProfile, emotion = '', context = '') {
        if (!this.isInitialized) {
            throw new Error('图像生成系统未初始化');
        }

        try {
            console.log('Generating contextual character image...');
            
            // 基础图像提示词
            let prompt = aiProfile.generateImagePrompt();
            
            // 添加情绪和情境描述
            if (emotion) {
                prompt += `, ${emotion} expression`;
            }
            
            if (context) {
                prompt += `, ${context}`;
            }
            
            console.log('Contextual image prompt:', prompt);
            
            // 生成图像 - 通过提示词实现透明背景
            const generatedImage = await this.imageClient.generateImage({
                prompt: prompt,
                size: '1024x1024'
            });
            
            // 获取图像URL
            const imageUrl = this.extractImageUrl(generatedImage);
            
            // 保存生成的图像信息
            const imageInfo = {
                id: Date.now(),
                type: 'character_contextual',
                prompt: prompt,
                url: imageUrl,
                timestamp: Date.now(),
                aiProfile: aiProfile.nickname,
                emotion: emotion,
                context: context
            };
            
            this.generatedImages.push(imageInfo);
            this.currentCharacterImage = imageInfo;
            
            console.log('Contextual character image generated successfully');
            return imageInfo.url;
            
        } catch (error) {
            console.error('Failed to generate contextual character image:', error);
            
            if (error.message.includes('credits') || error.message.includes('balance')) {
                throw new Error('积分不足，无法生成图像');
            } else if (error.message.includes('network') || error.message.includes('API')) {
                throw new Error('网络连接失败，图像生成失败');
            } else {
                throw new Error('图像生成失败，请重试');
            }
        }
    }

    /**
     * 生成场景背景图像
     * @param {string} sceneDescription - 场景描述
     * @returns {Promise<string>} 图像URL
     */
    async generateSceneImage(sceneDescription) {
        if (!this.isInitialized) {
            throw new Error('图像生成系统未初始化');
        }

        try {
            console.log('Generating scene image...');
            
            // 首先检查缓存
            const cachedImageUrl = this.storageManager.loadBackgroundImage(sceneDescription);
            if (cachedImageUrl) {
                console.log('Using cached background image');
                
                // 保存生成的图像信息
                const imageInfo = {
                    id: Date.now(),
                    type: 'scene_background',
                    prompt: 'cached',
                    url: cachedImageUrl,
                    timestamp: Date.now(),
                    sceneDescription: sceneDescription,
                    cached: true
                };
                
                this.generatedImages.push(imageInfo);
                
                return cachedImageUrl;
            }
            
            // 构建高质量场景图像提示词 - 优化版本
            const prompt = `Ultra high quality anime background scene, ${sceneDescription}, masterpiece, best quality, highly detailed environment, crisp sharp details, professional anime art style, 8K resolution, perfect lighting, no blur, crystal clear`;
            console.log('Scene image prompt:', prompt);
            
            // 优化图像生成参数 - 优先使用更高质量的模型
            let generatedImage;
            try {
                // 尝试使用gpt-image-1（通常质量更高）
                const highQualityClient = this.sdk.createImageClient('gpt-image-1');
                generatedImage = await highQualityClient.generateImage({
                    prompt: prompt,
                    size: '1024x1024',
                    quality: 'hd',
                    style: 'vivid' // 添加生动风格参数
                });
                console.log('✅ 使用 gpt-image-1 生成背景图像');
            } catch (gptError) {
                console.log('gpt-image-1 failed, trying nano-banana:', gptError.message);
                try {
                    // 备选方案：使用nano-banana
                    const sceneClient = this.sdk.createImageClient('nano-banana');
                    generatedImage = await sceneClient.generateImage({
                        prompt: prompt,
                        size: '1024x1024',
                        quality: 'hd'
                    });
                    console.log('✅ 使用 nano-banana 生成背景图像');
                } catch (nanoError) {
                    console.log('nano-banana failed, using default client:', nanoError.message);
                    // 最后备选：使用默认客户端
                    generatedImage = await this.imageClient.generateImage({
                        prompt: prompt,
                        size: '1024x1024',
                        quality: 'hd'
                    });
                    console.log('✅ 使用默认客户端生成背景图像');
                }
            }
            
            // 获取图像URL
            const imageUrl = this.extractImageUrl(generatedImage);
            
            // 保存到缓存
            await this.storageManager.saveBackgroundImage(sceneDescription, imageUrl);
            
            // 保存生成的图像信息
            const imageInfo = {
                id: Date.now(),
                type: 'scene_background',
                prompt: prompt,
                url: imageUrl,
                timestamp: Date.now(),
                sceneDescription: sceneDescription
            };
            
            this.generatedImages.push(imageInfo);
            
            console.log('Scene image generated successfully');
            return imageInfo.url;
            
        } catch (error) {
            console.error('Failed to generate scene image:', error);
            
            if (error.message.includes('credits') || error.message.includes('balance')) {
                throw new Error('积分不足，无法生成场景图像');
            } else if (error.message.includes('network') || error.message.includes('API')) {
                throw new Error('网络连接失败，场景图像生成失败');
            } else {
                throw new Error('场景图像生成失败，请重试');
            }
        }
    }

    /**
     * 分析对话内容并决定是否需要生成新图像
     * @param {string} aiMessage - AI回复内容
     * @param {CharacterProfile} aiProfile - AI角色设定
     * @returns {Promise<string|null>} 新图像URL或null
     */
    async analyzeAndGenerateImage(aiMessage, aiProfile) {
        try {
            console.log('🔍 分析消息内容:', aiMessage);
            
            // 检测场景变化
            const sceneChange = this.detectSceneChange(aiMessage);
            console.log('🌄 场景检测结果:', sceneChange);
            
            if (sceneChange) {
                console.log('🌄 检测到场景变化:', sceneChange);
                // 生成场景背景图像
                const backgroundUrl = await this.generateSceneImage(sceneChange);
                return {
                    type: 'background',
                    url: backgroundUrl
                };
            }
            
            // 检测情绪变化 - 重新启用，但只用于角色图像
            const emotions = this.detectEmotions(aiMessage);
            console.log('😊 情绪检测结果:', emotions);
            
            if (emotions.length > 0) {
                console.log('😊 检测到情绪变化:', emotions[0]);
                const emotion = emotions[0];
                const characterUrl = await this.generateContextualCharacterImage(aiProfile, emotion, '');
                return {
                    type: 'character',
                    url: characterUrl
                };
            }
            
            console.log('❌ 未检测到场景或情绪变化');
            return null; // 不需要生成新图像
            
        } catch (error) {
            console.error('Failed to analyze and generate image:', error);
            return null; // 失败时返回null，不影响对话流程
        }
    }

    /**
     * 检测对话中的情绪
     * @param {string} message - 消息内容
     * @returns {Array<string>} 检测到的情绪数组
     */
    detectEmotions(message) {
        console.log('🔍 检测情绪变化，消息:', message);
        
        const emotions = [];
        const emotionKeywords = {
            'happy': ['开心', '高兴', '快乐', '兴奋', '愉快', '哈哈', '笑', '😊', '😄', '😁'],
            'sad': ['难过', '伤心', '沮丧', '失落', '悲伤', '哭', '😢', '😭', '😞'],
            'angry': ['生气', '愤怒', '恼火', '气愤', '讨厌', '😠', '😡', '🤬'],
            'surprised': ['惊讶', '震惊', '意外', '吃惊', '哇', '😲', '😮', '😯'],
            'shy': ['害羞', '羞涩', '不好意思', '脸红', '😳', '😊'],
            'worried': ['担心', '焦虑', '忧虑', '不安', '紧张', '😟', '😰', '😨'],
            'confused': ['困惑', '疑惑', '不明白', '奇怪', '🤔', '😕'],
            'excited': ['激动', '兴奋', '期待', '太好了', '棒', '🤩', '😍']
        };

        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            for (const keyword of keywords) {
                if (message.includes(keyword)) {
                    console.log('✅ 找到情绪关键词:', keyword, '→', emotion);
                    emotions.push(emotion);
                    break; // 找到一个就跳出内层循环
                }
            }
        }

        console.log('🎭 检测到的情绪:', emotions);
        return emotions;
    }

    /**
     * 检测对话中的场景变化
     * @param {string} message - 消息内容
     * @returns {string|null} 场景描述或null
     */
    detectSceneChange(message) {
        console.log('🔍 检测场景变化，消息:', message);
        
        const sceneKeywords = {
            'park': ['公园', '草地', '树木', '长椅', '花园'],
            'classroom': ['教室', '课堂', '黑板', '讲台', '上课'],
            'cafe': ['咖啡厅', '咖啡店', '咖啡馆', '奶茶店'],
            'home': ['家里', '房间', '客厅', '卧室', '家中'],
            'school': ['学校', '校园', '操场', '图书馆', '食堂'],
            'street': ['街道', '马路', '商店', '路边', '街上'],
            'restaurant': ['餐厅', '饭店', '用餐', '吃饭'],
            'library': ['图书馆', '书店', '阅读室'],
            'beach': ['海边', '沙滩', '海滩', '海岸'],
            'mountain': ['山上', '山顶', '爬山', '登山'],
            'office': ['办公室', '公司', '工作'],
            'hospital': ['医院', '诊所', '看病']
        };

        // 直接检查是否包含场景关键词
        for (const [scene, keywords] of Object.entries(sceneKeywords)) {
            for (const keyword of keywords) {
                if (message.includes(keyword)) {
                    console.log('✅ 找到场景关键词:', keyword, '→', scene);
                    return `beautiful anime ${scene} scene, detailed background, soft lighting, peaceful atmosphere`;
                }
            }
        }

        console.log('❌ 未找到场景关键词');
        return null;
    }

    /**
     * 强制生成新的角色图像（跳过缓存）
     * @param {CharacterProfile} aiProfile - AI角色设定
     * @returns {Promise<string>} 图像URL
     */
    async forceGenerateCharacterImage(aiProfile) {
        if (!this.isInitialized) {
            throw new Error('图像生成系统未初始化');
        }

        try {
            console.log('Force generating new character image...');
            
            // 生成图像提示词
            const prompt = aiProfile.generateImagePrompt();
            console.log('Image prompt:', prompt);
            
            // 生成图像 - 通过提示词实现透明背景
            const generatedImage = await this.imageClient.generateImage({
                prompt: prompt,
                size: '1024x1024'
            });
            
            // 获取图像URL
            const imageUrl = this.extractImageUrl(generatedImage);
            
            // 更新缓存
            await this.storageManager.saveCharacterImage(aiProfile, imageUrl);
            
            // 保存生成的图像信息
            const imageInfo = {
                id: Date.now(),
                type: 'character_initial',
                prompt: prompt,
                url: imageUrl,
                timestamp: Date.now(),
                aiProfile: aiProfile.nickname,
                forced: true
            };
            
            this.generatedImages.push(imageInfo);
            this.currentCharacterImage = imageInfo;
            
            console.log('Character image force generated successfully');
            return imageInfo.url;
            
        } catch (error) {
            console.error('Failed to force generate character image:', error);
            throw error;
        }
    }

    /**
     * 强制生成新的场景图像（跳过缓存）
     * @param {string} sceneDescription - 场景描述
     * @returns {Promise<string>} 图像URL
     */
    async forceGenerateSceneImage(sceneDescription) {
        if (!this.isInitialized) {
            throw new Error('图像生成系统未初始化');
        }

        try {
            console.log('Force generating new scene image...');
            
            // 构建场景图像提示词
            const prompt = `Beautiful anime-style background scene, ${sceneDescription}, detailed environment, soft lighting, high quality, anime art style`;
            console.log('Scene image prompt:', prompt);
            
            // 尝试使用场景专用的图像客户端，如果失败则使用默认客户端
            let generatedImage;
            try {
                const sceneClient = this.sdk.createImageClient('nano-banana');
                generatedImage = await sceneClient.generateImage({
                    prompt: prompt,
                    size: '1024x1024',
                    quality: 'hd' // 添加高质量参数
                });
            } catch (sceneError) {
                console.log('nano-banana failed, trying with default client:', sceneError.message);
                generatedImage = await this.imageClient.generateImage({
                    prompt: prompt,
                    size: '1024x1024',
                    quality: 'hd' // 添加高质量参数
                });
            }
            
            // 获取图像URL
            const imageUrl = this.extractImageUrl(generatedImage);
            
            // 更新缓存
            await this.storageManager.saveBackgroundImage(sceneDescription, imageUrl);
            
            // 保存生成的图像信息
            const imageInfo = {
                id: Date.now(),
                type: 'scene_background',
                prompt: prompt,
                url: imageUrl,
                timestamp: Date.now(),
                sceneDescription: sceneDescription,
                forced: true
            };
            
            this.generatedImages.push(imageInfo);
            
            console.log('Scene image force generated successfully');
            return imageInfo.url;
            
        } catch (error) {
            console.error('Failed to force generate scene image:', error);
            throw error;
        }
    }

    /**
     * 获取当前角色图像
     * @returns {Object|null} 当前角色图像信息
     */
    getCurrentCharacterImage() {
        return this.currentCharacterImage;
    }

    /**
     * 获取所有生成的图像
     * @returns {Array} 图像信息数组
     */
    getAllGeneratedImages() {
        return [...this.generatedImages];
    }

    /**
     * 获取指定类型的图像
     * @param {string} type - 图像类型
     * @returns {Array} 图像信息数组
     */
    getImagesByType(type) {
        return this.generatedImages.filter(img => img.type === type);
    }

    /**
     * 清除所有生成的图像
     */
    clearGeneratedImages() {
        this.generatedImages = [];
        this.currentCharacterImage = null;
        console.log('Generated images cleared');
    }

    /**
     * 获取图像生成统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const totalImages = this.generatedImages.length;
        const characterImages = this.generatedImages.filter(img => img.type.includes('character')).length;
        const sceneImages = this.generatedImages.filter(img => img.type.includes('scene')).length;
        
        return {
            totalImages,
            characterImages,
            sceneImages,
            currentCharacterImage: this.currentCharacterImage ? this.currentCharacterImage.id : null,
            isInitialized: this.isInitialized
        };
    }

    /**
     * 生成自定义图像（GM菜单功能）
     * @param {string} customPrompt - 自定义提示词
     * @param {string} type - 图像类型 ('character' 或 'background')
     * @returns {Promise<string>} 图像URL
     */
    async generateCustomImage(customPrompt, type) {
        if (!this.isInitialized) {
            throw new Error('图像生成系统未初始化');
        }

        try {
            console.log(`Generating custom ${type} image with prompt:`, customPrompt);
            
            // 根据类型选择合适的图像客户端
            let imageClient = this.imageClient; // 默认使用gpt-image-1
            
            if (type === 'background') {
                // 对于背景图像，尝试使用nano-banana，失败则回退到默认客户端
                try {
                    imageClient = this.sdk.createImageClient('nano-banana');
                } catch (error) {
                    console.log('nano-banana not available, using default client');
                    imageClient = this.imageClient;
                }
            }
            
            // 生成图像
            const generatedImage = await imageClient.generateImage({
                prompt: customPrompt,
                size: '1024x1024'
            });
            
            // 获取图像URL
            const imageUrl = this.extractImageUrl(generatedImage);
            
            // 保存生成的图像信息
            const imageInfo = {
                id: Date.now(),
                type: `custom_${type}`,
                prompt: customPrompt,
                url: imageUrl,
                timestamp: Date.now(),
                custom: true
            };
            
            this.generatedImages.push(imageInfo);
            
            // 如果是角色图像，更新当前角色图像
            if (type === 'character') {
                this.currentCharacterImage = imageInfo;
            }
            
            console.log(`Custom ${type} image generated successfully`);
            return imageUrl;
            
        } catch (error) {
            console.error(`Failed to generate custom ${type} image:`, error);
            
            if (error.message.includes('credits') || error.message.includes('balance')) {
                throw new Error('积分不足，无法生成图像');
            } else if (error.message.includes('network') || error.message.includes('API')) {
                throw new Error('网络连接失败，图像生成失败');
            } else {
                throw new Error(`自定义${type === 'character' ? '角色' : '背景'}图像生成失败，请重试`);
            }
        }
    }

    /**
     * 销毁图像生成系统
     */
    destroy() {
        try {
            this.sdk = null;
            this.imageClient = null;
            this.generatedImages = [];
            this.currentCharacterImage = null;
            this.isInitialized = false;
            
            console.log('Image generation system destroyed');
        } catch (error) {
            console.error('Failed to destroy image generation system:', error);
        }
    }
}