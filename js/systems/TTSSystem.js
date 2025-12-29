/**
 * 火山引擎TTS语音合成系统
 * 负责将AI生成的文本转换为语音并播放
 */

class TTSSystem {
    constructor() {
        this.isInitialized = false;
        this.isPlaying = false;
        this.currentAudio = null;
        this.audioQueue = [];
        this.isProcessing = false;
        
        // TTS配置 - 使用本地代理服务器
        this.config = {
            appId: '', // 火山引擎APP ID (由代理服务器使用)
            accessKey: '', // 火山引擎Access Key (由代理服务器使用)
            resourceId: 'seed-tts-1.0',
            apiUrl: 'http://localhost:3001/api/tts',
            proxyMode: true
        };
        
        // 默认音频参数
        this.audioParams = {
            format: 'mp3',
            sample_rate: 24000,
            speech_rate: 0, // 语速 [-50, 100]
            loudness_rate: 0, // 音量 [-50, 100]
            emotion: '', // 情感
            emotion_scale: 4 // 情绪强度 [1-5]
        };
        
        // 默认发音人 - 使用豆包1.0版本的音色
        this.defaultSpeakers = {
            female: 'zh_female_cancan_mars_bigtts',
            male: 'zh_male_ahu_conversation_wvae_bigtts',
            other: 'zh_female_cancan_mars_bigtts'
        };
        
        this.currentSpeaker = this.defaultSpeakers.female;
        
        // 音频上下文
        this.audioContext = null;
        this.gainNode = null;
        this.volume = 0.8;
        
        console.log('TTS System initialized');
    }

    /**
     * 初始化TTS系统
     * @param {Object} config - TTS配置
     * @param {string} config.appId - 火山引擎APP ID
     * @param {string} config.accessKey - 火山引擎Access Token
     * @param {string} config.resourceId - 资源ID，默认使用seed-tts-2.0
     */
    async initialize(config) {
        try {
            console.log('Initializing TTS System...');
            
            // 更新配置
            this.config = {
                ...this.config,
                ...config
            };
            
            // 验证必要配置
            if (!this.config.appId || !this.config.accessKey) {
                throw new Error('TTS配置不完整：缺少APP ID或Access Token');
            }
            
            // 初始化Web Audio API
            await this.initializeAudioContext();
            
            // 测试TTS服务连接
            await this.testConnection();
            
            this.isInitialized = true;
            console.log('TTS System initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize TTS System:', error);
            throw new Error('TTS系统初始化失败：' + error.message);
        }
    }

    /**
     * 初始化音频上下文
     */
    async initializeAudioContext() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建音量控制节点
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.volume;
            
            console.log('Audio context initialized');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            throw new Error('音频系统初始化失败');
        }
    }

    /**
     * 测试TTS服务连接
     */
    async testConnection() {
        try {
            console.log('🔍 Testing TTS connection...');
            
            // 如果使用代理模式，先检查代理服务器
            if (this.config.proxyMode) {
                const healthUrl = this.config.apiUrl.replace('/api/tts', '/api/health');
                try {
                    const healthResponse = await fetch(healthUrl);
                    if (!healthResponse.ok) {
                        throw new Error('代理服务器不可用');
                    }
                    const healthData = await healthResponse.json();
                    console.log('✅ Proxy server health check:', healthData);
                } catch (error) {
                    throw new Error('代理服务器连接失败，请确保运行了 npm start');
                }
            }
            
            // 发送一个简短的测试请求
            const testText = '测试';
            
            // 构建测试请求
            const requestData = {
                user: { uid: 'test_user' },
                namespace: 'BidirectionalTTS',
                req_params: {
                    text: testText,
                    speaker: this.defaultSpeakers.female,
                    audio_params: {
                        format: 'mp3',
                        sample_rate: 24000
                    }
                }
            };

            // 在代理模式下，不需要设置火山引擎的请求头
            const headers = {
                'Content-Type': 'application/json'
            };

            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API请求失败: ${response.status} - ${errorText}`);
            }

            console.log('✅ TTS connection test successful');
            
        } catch (error) {
            console.error('❌ TTS connection test failed:', error);
            
            // 提供更友好的错误信息
            if (error.message.includes('代理服务器')) {
                throw new Error(error.message);
            } else if (error.message.includes('Failed to fetch') && this.config.proxyMode) {
                throw new Error('无法连接到代理服务器，请运行 npm start 启动服务器');
            } else if (error.message.includes('404')) {
                throw new Error('TTS服务端点不可用，请检查网络连接');
            } else if (error.message.includes('401') || error.message.includes('403')) {
                throw new Error('TTS认证失败，请检查APP ID和Access Token');
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                throw new Error('网络连接失败，请检查网络设置');
            } else {
                throw new Error('TTS服务连接失败：' + error.message);
            }
        }
    }

    /**
     * 设置AI角色的发音人
     * @param {CharacterProfile} aiProfile - AI角色设定
     */
    setCharacterVoice(aiProfile) {
        if (!aiProfile) return;
        
        // 根据AI角色性别选择发音人
        const gender = aiProfile.gender || 'female';
        this.currentSpeaker = this.defaultSpeakers[gender] || this.defaultSpeakers.female;
        
        // 根据角色性格调整TTS参数
        this.adjustVoiceForCharacter(aiProfile);
        
        console.log(`Set TTS speaker to: ${this.currentSpeaker} for character: ${aiProfile.nickname}`);
    }

    /**
     * 语音合成并播放文本
     * @param {string} text - 要合成的文本
     * @param {boolean} autoPlay - 是否自动播放，默认true
     * @param {Object} options - 额外选项
     * @returns {Promise<ArrayBuffer|null>} 音频数据
     */
    async synthesizeAndPlay(text, autoPlay = true, options = {}) {
        if (!this.isInitialized) {
            console.warn('TTS System not initialized');
            return null;
        }

        if (!text || text.trim().length === 0) {
            console.warn('Empty text provided for TTS');
            return null;
        }

        try {
            console.log('🎵 Synthesizing text:', text.substring(0, 50) + '...');
            
            // 如果正在播放，停止当前播放
            if (this.isPlaying) {
                this.stopCurrentAudio();
            }
            
            // 合成语音
            const audioData = await this.synthesizeText(text, autoPlay, options);
            
            if (audioData && autoPlay) {
                await this.playAudio(audioData);
            }
            
            return audioData;
            
        } catch (error) {
            console.error('Failed to synthesize and play text:', error);
            throw error;
        }
    }

    /**
     * 合成文本为语音数据
     * @param {string} text - 要合成的文本
     * @param {boolean} forPlay - 是否用于播放
     * @param {Object} options - 额外选项
     * @returns {Promise<ArrayBuffer>} 音频数据
     */
    async synthesizeText(text, forPlay = true, options = {}) {
        try {
            this.isProcessing = true;
            
            // 构建请求数据 - 完全按照Python示例格式
            const requestData = {
                user: {
                    uid: 'ai_galgame_user_' + Date.now()
                },
                req_params: {
                    text: text.trim(),
                    speaker: options.speaker || this.currentSpeaker,
                    audio_params: {
                        format: this.audioParams.format,
                        sample_rate: this.audioParams.sample_rate,
                        speech_rate: this.audioParams.speech_rate,
                        loudness_rate: this.audioParams.loudness_rate,
                        ...options.audioParams
                    }
                }
            };

            // 如果有情感设置，添加到音频参数中
            if (options.emotion) {
                requestData.req_params.audio_params.emotion = options.emotion;
                requestData.req_params.audio_params.emotion_scale = options.emotionScale || this.audioParams.emotion_scale;
            }

            console.log('🌐 Sending TTS request:', {
                text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                speaker: requestData.req_params.speaker,
                format: requestData.req_params.audio_params.format
            });
            
            // 发送请求到代理服务器
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ TTS API Error Response:', errorText);
                throw new Error(`API请求失败: ${response.status} - ${errorText}`);
            }

            // 处理流式响应
            const audioChunks = [];
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            console.log('📡 开始接收TTS流式数据...');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // 累积数据到缓冲区
                buffer += decoder.decode(value, { stream: true });
                
                // 按行分割处理
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // 保留最后一个可能不完整的行

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    try {
                        const jsonData = JSON.parse(trimmedLine);
                        
                        if (jsonData.code === 20000000) {
                            // 合成完成
                            console.log('✅ TTS synthesis completed');
                            if (jsonData.usage) {
                                console.log('📊 TTS usage:', jsonData.usage);
                            }
                            // 不要break，继续处理可能剩余的数据
                        } else if (jsonData.code === 0 && jsonData.data) {
                            // 音频数据块
                            const audioBase64 = jsonData.data;
                            const audioBytes = this.base64ToArrayBuffer(audioBase64);
                            audioChunks.push(audioBytes);
                            console.log(`📦 收到音频块: ${audioBytes.byteLength} bytes`);
                        } else if (jsonData.code > 0 && jsonData.code !== 20000000) {
                            // 错误响应
                            throw new Error(`TTS合成失败: ${jsonData.code} - ${jsonData.message}`);
                        }
                    } catch (parseError) {
                        // 忽略JSON解析错误，可能是不完整的数据块
                        console.warn('JSON解析错误，跳过:', trimmedLine.substring(0, 100));
                        continue;
                    }
                }
            }

            // 处理缓冲区中剩余的数据
            if (buffer.trim()) {
                try {
                    const jsonData = JSON.parse(buffer.trim());
                    if (jsonData.code === 0 && jsonData.data) {
                        const audioBase64 = jsonData.data;
                        const audioBytes = this.base64ToArrayBuffer(audioBase64);
                        audioChunks.push(audioBytes);
                        console.log(`📦 收到最后音频块: ${audioBytes.byteLength} bytes`);
                    }
                } catch (parseError) {
                    console.warn('处理剩余数据时出错:', parseError);
                }
            }

            if (audioChunks.length === 0) {
                throw new Error('未收到任何音频数据');
            }

            // 合并音频数据
            const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
            const mergedAudio = new Uint8Array(totalLength);
            let offset = 0;
            
            for (const chunk of audioChunks) {
                mergedAudio.set(new Uint8Array(chunk), offset);
                offset += chunk.byteLength;
            }

            console.log(`🎵 TTS synthesis successful, total chunks: ${audioChunks.length}, audio size: ${mergedAudio.byteLength} bytes`);
            return mergedAudio.buffer;

        } catch (error) {
            console.error('TTS synthesis failed:', error);
            throw new Error('语音合成失败：' + error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 播放音频数据
     * @param {ArrayBuffer} audioData - 音频数据
     */
    async playAudio(audioData) {
        try {
            console.log('🔊 Playing TTS audio...');
            
            // 停止当前播放
            this.stopCurrentAudio();
            
            // 创建Blob URL方式播放（更稳定）
            const audioBlob = new Blob([audioData], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // 创建Audio元素
            const audio = new Audio(audioUrl);
            audio.volume = this.volume;
            audio.preload = 'auto'; // 预加载音频
            
            // 设置播放状态
            this.isPlaying = true;
            this.currentAudio = audio;
            
            // 播放结束回调
            audio.onended = () => {
                console.log('🔇 TTS audio playback finished naturally');
                this.isPlaying = false;
                this.currentAudio = null;
                URL.revokeObjectURL(audioUrl); // 清理URL
                
                // 播放队列中的下一个音频
                this.playNextInQueue();
            };
            
            // 播放错误回调
            audio.onerror = (error) => {
                console.error('Audio playback error:', error);
                this.isPlaying = false;
                this.currentAudio = null;
                URL.revokeObjectURL(audioUrl);
            };

            // 音频加载完成回调
            audio.onloadeddata = () => {
                console.log(`🎵 Audio loaded, duration: ${audio.duration}s`);
            };

            // 播放进度回调（用于调试）
            audio.ontimeupdate = () => {
                if (audio.duration) {
                    const progress = (audio.currentTime / audio.duration * 100).toFixed(1);
                    // 只在特定进度点打印，避免日志过多
                    if (audio.currentTime > 0 && (progress % 25 < 0.1 || progress > 99)) {
                        console.log(`🎵 播放进度: ${progress}% (${audio.currentTime.toFixed(1)}s / ${audio.duration.toFixed(1)}s)`);
                    }
                }
            };
            
            // 开始播放
            await audio.play();
            console.log('🎵 TTS audio started playing');
            
        } catch (error) {
            console.error('Failed to play TTS audio:', error);
            this.isPlaying = false;
            this.currentAudio = null;
            throw new Error('音频播放失败：' + error.message);
        }
    }

    /**
     * 停止当前音频播放
     */
    stopCurrentAudio() {
        console.log('🛑 Stopping current audio...');
        
        if (this.currentAudio) {
            try {
                if (this.currentAudio.pause) {
                    // HTML Audio元素
                    this.currentAudio.pause();
                    this.currentAudio.currentTime = 0;
                    this.currentAudio.src = ''; // 清空音频源
                } else if (this.currentAudio.stop) {
                    // AudioBufferSource
                    this.currentAudio.stop();
                }
                console.log('✅ Audio stopped successfully');
            } catch (error) {
                // 忽略停止错误
                console.warn('停止音频时出错:', error);
            }
            this.currentAudio = null;
        }
        
        this.isPlaying = false;
        
        // 清空播放队列
        this.audioQueue = [];
        
        console.log('🔇 Audio system reset');
    }

    /**
     * 播放队列中的下一个音频
     */
    async playNextInQueue() {
        if (this.audioQueue.length > 0) {
            const nextAudio = this.audioQueue.shift();
            await this.playAudio(nextAudio);
        }
    }

    /**
     * 添加音频到播放队列
     * @param {ArrayBuffer} audioData - 音频数据
     */
    addToQueue(audioData) {
        this.audioQueue.push(audioData);
        
        // 如果当前没有播放，立即播放
        if (!this.isPlaying) {
            this.playNextInQueue();
        }
    }

    /**
     * 清空播放队列
     */
    clearQueue() {
        this.audioQueue = [];
    }

    /**
     * 设置音量
     * @param {number} volume - 音量 [0-1]
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
        console.log(`TTS volume set to: ${this.volume}`);
    }

    /**
     * 设置语速
     * @param {number} speechRate - 语速 [-50, 100]
     */
    setSpeechRate(speechRate) {
        this.audioParams.speech_rate = Math.max(-50, Math.min(100, speechRate));
        console.log(`TTS speech rate set to: ${this.audioParams.speech_rate}`);
    }

    /**
     * 设置情感
     * @param {string} emotion - 情感类型
     * @param {number} scale - 情感强度 [1-5]
     */
    setEmotion(emotion, scale = 4) {
        this.audioParams.emotion = emotion;
        this.audioParams.emotion_scale = Math.max(1, Math.min(5, scale));
        console.log(`TTS emotion set to: ${emotion} (scale: ${scale})`);
    }

    /**
     * 根据AI回复内容智能设置情感 - 增强版本
     * @param {string} text - AI回复文本
     */
    setEmotionFromText(text) {
        console.log('🎭 分析文本情感:', text);
        
        // 更精确的情感检测
        const emotions = {
            'happy': {
                keywords: ['开心', '高兴', '快乐', '兴奋', '愉快', '哈哈', '笑', '太好了', '棒', '耶', '嘿嘿'],
                intensity: 4
            },
            'sad': {
                keywords: ['难过', '伤心', '沮丧', '失落', '悲伤', '哭', '呜呜', '555'],
                intensity: 3
            },
            'angry': {
                keywords: ['生气', '愤怒', '恼火', '气愤', '讨厌', '烦人', '可恶'],
                intensity: 4
            },
            'surprised': {
                keywords: ['惊讶', '震惊', '意外', '吃惊', '哇', '天哪', '不会吧', '真的吗'],
                intensity: 4
            },
            'shy': {
                keywords: ['害羞', '羞涩', '不好意思', '脸红', '羞羞', '人家'],
                intensity: 3
            },
            'worried': {
                keywords: ['担心', '焦虑', '忧虑', '不安', '紧张', '怎么办'],
                intensity: 3
            },
            'confused': {
                keywords: ['困惑', '疑惑', '不明白', '奇怪', '为什么', '怎么回事'],
                intensity: 2
            },
            'excited': {
                keywords: ['激动', '兴奋', '期待', '迫不及待', '好想', '超级'],
                intensity: 5
            },
            'gentle': {
                keywords: ['温柔', '轻声', '小声', '柔和', '慢慢', '轻轻'],
                intensity: 2
            },
            'playful': {
                keywords: ['调皮', '淘气', '嘿嘿', '略略', '哼哼', '嘻嘻'],
                intensity: 3
            }
        };

        // 检测情感
        let detectedEmotion = null;
        let maxMatches = 0;
        let emotionIntensity = 3;

        for (const [emotion, config] of Object.entries(emotions)) {
            let matches = 0;
            for (const keyword of config.keywords) {
                if (text.includes(keyword)) {
                    matches++;
                }
            }
            
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedEmotion = emotion;
                emotionIntensity = config.intensity;
            }
        }

        // 根据标点符号调整情感强度
        if (text.includes('！！') || text.includes('？？')) {
            emotionIntensity = Math.min(5, emotionIntensity + 1);
        } else if (text.includes('...') || text.includes('。。。')) {
            emotionIntensity = Math.max(1, emotionIntensity - 1);
        }

        // 根据语气词微调情感
        if (text.includes('呢~') || text.includes('哦~') || text.includes('呀~')) {
            if (!detectedEmotion) {
                detectedEmotion = 'gentle';
                emotionIntensity = 2;
            }
        } else if (text.includes('哈哈') || text.includes('嘿嘿')) {
            detectedEmotion = 'happy';
            emotionIntensity = 4;
        }

        if (detectedEmotion) {
            console.log('✅ 检测到情感:', detectedEmotion, '强度:', emotionIntensity);
            this.setEmotion(detectedEmotion, emotionIntensity);
            return detectedEmotion;
        }

        // 默认使用温和的情感
        this.audioParams.emotion = '';
        console.log('😐 未检测到特殊情感，使用默认');
        return null;
    }

    /**
     * 根据角色性格调整TTS参数
     * @param {CharacterProfile} aiProfile - AI角色设定
     */
    adjustVoiceForCharacter(aiProfile) {
        if (!aiProfile) return;

        const settings = aiProfile.settings.toLowerCase();
        
        // 根据角色性格调整语速
        if (settings.includes('活泼') || settings.includes('开朗')) {
            this.setSpeechRate(10); // 稍快
        } else if (settings.includes('温柔') || settings.includes('文静')) {
            this.setSpeechRate(-10); // 稍慢
        } else if (settings.includes('急性子') || settings.includes('急躁')) {
            this.setSpeechRate(20); // 较快
        } else if (settings.includes('慢性子') || settings.includes('悠闲')) {
            this.setSpeechRate(-20); // 较慢
        }

        // 根据角色性格调整音量
        if (settings.includes('害羞') || settings.includes('内向')) {
            this.audioParams.loudness_rate = -10; // 稍小声
        } else if (settings.includes('外向') || settings.includes('大声')) {
            this.audioParams.loudness_rate = 10; // 稍大声
        }

        console.log('🎭 根据角色调整语音参数:', {
            speechRate: this.audioParams.speech_rate,
            loudnessRate: this.audioParams.loudness_rate
        });
    }

    /**
     * Base64转ArrayBuffer
     * @param {string} base64 - Base64字符串
     * @returns {ArrayBuffer} ArrayBuffer数据
     */
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * 生成请求ID
     * @returns {string} UUID格式的请求ID
     */
    generateRequestId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 获取TTS状态
     * @returns {Object} TTS状态信息
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isPlaying: this.isPlaying,
            isProcessing: this.isProcessing,
            queueLength: this.audioQueue.length,
            currentSpeaker: this.currentSpeaker,
            volume: this.volume,
            speechRate: this.audioParams.speech_rate,
            emotion: this.audioParams.emotion
        };
    }

    /**
     * 销毁TTS系统
     */
    destroy() {
        try {
            // 停止播放
            this.stopCurrentAudio();
            
            // 清空队列
            this.clearQueue();
            
            // 关闭音频上下文
            if (this.audioContext) {
                this.audioContext.close();
                this.audioContext = null;
            }
            
            this.isInitialized = false;
            console.log('TTS System destroyed');
            
        } catch (error) {
            console.error('Failed to destroy TTS System:', error);
        }
    }
}