/**
 * 对话系统
 * 处理玩家输入和AI回复的核心逻辑
 */

class DialogueSystem {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.sdk = null;
        this.npcClient = null;
        this.dialogueHistory = [];
        this.isInitialized = false;
        this.isProcessing = false;
    }

    /**
     * 初始化对话系统
     * @param {CharacterProfile} aiProfile - AI角色设定
     * @param {Object} sdkConfig - PlayKit SDK配置
     */
    async initialize(aiProfile, sdkConfig) {
        try {
            console.log('Initializing dialogue system...');
            
            // 初始化PlayKit SDK
            this.sdk = new PlayKitSDK.PlayKitSDK(sdkConfig);
            await this.sdk.initialize();
            
            // 创建NPC客户端
            const systemPrompt = aiProfile.generateSystemPrompt();
            console.log('📝 System Prompt:', systemPrompt);
            
            this.npcClient = this.sdk.createNPCClient({
                systemPrompt: systemPrompt,
                temperature: 0.7,  // 降低温度，让回复更稳定
                maxHistoryLength: 20  // 减少历史长度
            });

            // 加载历史对话（如果有的话）
            const savedHistory = this.storageManager.loadDialogueHistory();
            
            // 检查历史对话是否属于当前角色
            if (savedHistory && savedHistory.length > 0) {
                // 检查第一条AI消息是否匹配当前角色的开场白
                const firstAiMessage = savedHistory.find(entry => entry.sender === 'ai');
                if (firstAiMessage && firstAiMessage.message === aiProfile.opening) {
                    // 历史对话属于当前角色，恢复它
                    this.dialogueHistory = savedHistory;
                    this.restoreNPCHistory();
                    console.log('✅ 恢复了', this.dialogueHistory.length, '条历史对话');
                } else {
                    // 历史对话不属于当前角色，清除它
                    console.log('⚠️ 历史对话不属于当前角色，清除旧数据');
                    this.dialogueHistory = [];
                    this.storageManager.clearDialogueHistory();
                }
            } else {
                this.dialogueHistory = [];
            }

            this.isInitialized = true;
            console.log('Dialogue system initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize dialogue system:', error);
            throw new Error('对话系统初始化失败');
        }
    }

    /**
     * 智能后处理AI回复 - 彻底过滤AI分析性回复
     * @param {string} reply - 原始回复
     * @returns {string} 处理后的回复
     */
    postProcessReply(reply) {
        if (!reply) return '嗯？';
        
        console.log('🔍 原始AI回复:', reply);
        
        let processed = reply;
        
        // 第一步：检测是否是分析性回复（AI在分析而不是对话）
        const analysisIndicators = [
            '好的，', '好的,', '需要', '可以', '应该', '会表现', '会展现',
            '构建', '场景', '设定', '规则', '任务', '回应', '对话',
            '作为', '根据', '同时', '此时', '正在', '表现出',
            '性格', '特质', '角色', '用户', '玩家'
        ];
        
        const isAnalysisReply = analysisIndicators.some(indicator => 
            processed.includes(indicator)
        );
        
        if (isAnalysisReply) {
            console.log('⚠️ 检测到分析性回复，尝试提取有效内容');
            
            // 尝试提取引号内的对话内容
            const quotedMatch = processed.match(/["「『"']([^"」』"']+)["」』"']/);
            if (quotedMatch && quotedMatch[1].length > 2) {
                processed = quotedMatch[1];
                console.log('✅ 提取引号内容:', processed);
            } else {
                // 尝试提取动作描写后的内容
                const actionMatch = processed.match(/[（(][^）)]+[）)](.+)/);
                if (actionMatch && actionMatch[1].trim().length > 2) {
                    processed = actionMatch[0];
                    console.log('✅ 提取动作+对话:', processed);
                } else {
                    // 尝试提取最后一句话（通常是实际对话）
                    const sentences = processed.split(/[。！？~]/);
                    const lastValidSentence = sentences.reverse().find(s => {
                        const trimmed = s.trim();
                        return trimmed.length > 2 && 
                               !trimmed.includes('需要') && 
                               !trimmed.includes('可以') &&
                               !trimmed.includes('好的') &&
                               !trimmed.includes('设定') &&
                               !trimmed.includes('场景');
                    });
                    
                    if (lastValidSentence) {
                        processed = lastValidSentence.trim();
                        console.log('✅ 提取最后有效句:', processed);
                    } else {
                        // 完全无法提取，生成默认回复
                        processed = this.generateFallbackReply();
                        console.log('⚠️ 使用默认回复:', processed);
                    }
                }
            }
        }
        
        // 第二步：清理残留的分析性语言
        const cleanPatterns = [
            /^好的[，,]?/g,
            /^需要[^，。]*[，。]/g,
            /^可以[^，。]*[，。]/g,
            /^同时[^，。]*[，。]/g,
            /^此时[^，。]*[，。]/g,
            /注意[^，。]*[，。]/g,
            /规则[^，。]*[，。]/g,
            /设定[^，。]*[，。]/g,
            /对话[^，。]*[，。]/g,
            /场景[^，。]*[，。]/g,
            /表现[^，。]*[，。]/g,
            /展现[^，。]*[，。]/g,
        ];
        
        cleanPatterns.forEach(pattern => {
            processed = processed.replace(pattern, '');
        });
        
        // 第三步：处理重复字符
        processed = this.fixRepeatedCharacters(processed);
        
        // 第四步：清理空白和标点
        processed = processed.trim();
        processed = processed.replace(/^[，。！？~\s]+/, '');
        processed = processed.replace(/[，\s]+$/, '');
        
        // 第五步：如果还是太短或为空，生成自然回复
        if (!processed || processed.length < 2) {
            processed = this.generateFallbackReply();
        }
        
        // 第六步：控制长度
        if (processed.length > 50) {
            processed = this.smartTruncate(processed, 50);
        }
        
        // 第七步：确保有合适的结尾
        if (!/[。！？~）)」』]$/.test(processed)) {
            processed = this.addNaturalEnding(processed);
        }
        
        console.log('✅ 最终回复:', processed);
        return processed;
    }

    /**
     * 生成备用回复
     */
    generateFallbackReply() {
        const fallbacks = [
            '嗯？怎么了~',
            '诶？',
            '啊...是吗？',
            '哦哦~',
            '嘿嘿~',
            '唔...让我想想',
            '嗯嗯！',
            '真的吗？',
            '是呀~'
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    /**
     * 智能截断文本
     */
    smartTruncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        
        // 在标点处截断
        const punctuations = ['。', '！', '？', '~', '，'];
        for (const punct of punctuations) {
            const idx = text.lastIndexOf(punct, maxLength);
            if (idx > 10) {
                return text.substring(0, idx + 1);
            }
        }
        
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * 添加自然的结尾
     */
    addNaturalEnding(text) {
        if (/[吗呢]$/.test(text)) return text + '？';
        if (/[啊哦嗯呀]$/.test(text)) return text + '~';
        if (/[好棒赞]$/.test(text)) return text + '！';
        
        const endings = ['~', '！', '。', '呢~'];
        return text + endings[Math.floor(Math.random() * endings.length)];
    }

    /**
     * 获取角色名称
     */
    getCharacterName() {
        return this.npcClient?.systemPrompt?.match(/你是(.+?)，/)?.[1] || 
               this.npcClient?.systemPrompt?.match(/你现在是(.+?)，/)?.[1] || '';
    }

    /**
     * 修复重复字符问题
     * @param {string} text - 原始文本
     * @returns {string} 修复后的文本
     */
    fixRepeatedCharacters(text) {
        if (!text) return text;
        
        // 检测并修复重复的单个字符（如：好好的的 -> 好的）
        let fixed = text.replace(/(.)\1+/g, (match, char) => {
            // 如果是标点符号，保留重复（如：！！！）
            if (/[。！？~，、；：""''（）【】《》]/.test(char)) {
                return match;
            }
            // 其他字符只保留一个
            return char;
        });
        
        // 检测并修复重复的词组（如：需要需要 -> 需要）
        fixed = fixed.replace(/(.{2,}?)\1+/g, (match, group) => {
            // 如果重复的词组太长，可能是误判，保留原文
            if (group.length > 4) {
                return match;
            }
            return group;
        });
        
        // 清理多余的标点符号重复
        fixed = fixed.replace(/([，。！？~]){3,}/g, '$1$1');
        
        if (fixed !== text) {
            console.log('🔧 修复重复字符:', text, '->', fixed);
        }
        
        return fixed;
    }

    /**
     * 恢复NPC的对话历史
     */
    restoreNPCHistory() {
        try {
            // 清除NPC的历史记录
            this.npcClient.clearHistory();
            
            // 重新添加历史对话到NPC
            this.dialogueHistory.forEach(entry => {
                if (entry.sender === 'player') {
                    // 添加用户消息
                    this.npcClient.appendMessage({
                        role: 'user',
                        content: entry.message
                    });
                } else if (entry.sender === 'ai') {
                    // 添加AI回复
                    this.npcClient.appendMessage({
                        role: 'assistant',
                        content: entry.message
                    });
                }
            });
            
            console.log('NPC history restored with', this.dialogueHistory.length, 'messages');
        } catch (error) {
            console.error('Failed to restore NPC history:', error);
        }
    }

    /**
     * 发送消息给AI
     * @param {string} message - 用户消息
     * @returns {Promise<string>} AI回复
     */
    async sendMessage(message) {
        if (!this.isInitialized) {
            throw new Error('对话系统未初始化');
        }

        if (this.isProcessing) {
            throw new Error('正在处理中，请稍候');
        }

        // 验证输入
        const validation = this.validateInput(message);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        try {
            this.isProcessing = true;
            
            // 添加用户消息到历史
            const userEntry = {
                timestamp: Date.now(),
                sender: 'player',
                message: message.trim()
            };
            this.dialogueHistory.push(userEntry);

            // 发送给AI并获取回复
            const aiReply = await this.npcClient.talk(message.trim());

            // 添加AI回复到历史
            const aiEntry = {
                timestamp: Date.now(),
                sender: 'ai',
                message: aiReply
            };
            this.dialogueHistory.push(aiEntry);

            // 保存对话历史
            this.storageManager.saveDialogueHistory(this.dialogueHistory);

            return aiReply;

        } catch (error) {
            console.error('Failed to send message:', error);
            
            // 如果是网络错误或API错误，提供重试选项
            if (error.message.includes('network') || error.message.includes('API')) {
                throw new Error('网络连接失败，请检查网络后重试');
            } else if (error.message.includes('credits') || error.message.includes('balance')) {
                throw new Error('积分不足，请充值后继续');
            } else {
                throw new Error('发送消息失败，请重试');
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 发送消息并流式接收回复 - 简化版本
     * @param {string} message - 用户消息
     * @param {Function} onChunk - 接收文本片段的回调
     * @param {Function} onComplete - 完成时的回调
     * @returns {Promise<void>}
     */
    async sendMessageStream(message, onChunk, onComplete) {
        if (!this.isInitialized) {
            throw new Error('对话系统未初始化');
        }

        if (this.isProcessing) {
            throw new Error('正在处理中，请稍候');
        }

        // 验证输入
        const validation = this.validateInput(message);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        try {
            this.isProcessing = true;
            
            // 添加用户消息到历史
            const userEntry = {
                timestamp: Date.now(),
                sender: 'player',
                message: message.trim()
            };
            this.dialogueHistory.push(userEntry);

            // 直接发送消息，不添加额外提示词
            await this.npcClient.talkStream(
                message.trim(),
                onChunk,
                (fullReply) => {
                    // 强力后处理：过滤AI分析性回复
                    let processedReply = this.postProcessReply(fullReply);
                    
                    // 添加AI回复到历史
                    const aiEntry = {
                        timestamp: Date.now(),
                        sender: 'ai',
                        message: processedReply
                    };
                    this.dialogueHistory.push(aiEntry);

                    // 保存对话历史
                    this.storageManager.saveDialogueHistory(this.dialogueHistory);

                    if (onComplete) {
                        onComplete(processedReply);
                    }
                }
            );

        } catch (error) {
            console.error('Failed to send message stream:', error);
            
            // 错误处理
            if (error.message.includes('404')) {
                throw new Error('API端点未找到，请检查网络连接');
            } else if (error.message.includes('network') || error.message.includes('API')) {
                throw new Error('网络连接失败，请检查网络后重试');
            } else if (error.message.includes('credits') || error.message.includes('balance')) {
                throw new Error('积分不足，请充值后继续');
            } else {
                throw new Error(`发送消息失败: ${error.message}`);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 验证用户输入
     * @param {string} message - 用户消息
     * @returns {Object} 验证结果
     */
    validateInput(message) {
        if (!message || typeof message !== 'string') {
            return {
                isValid: false,
                error: '请输入消息内容'
            };
        }

        const trimmedMessage = message.trim();
        
        if (trimmedMessage.length === 0) {
            return {
                isValid: false,
                error: '消息不能为空'
            };
        }

        if (trimmedMessage.length > 500) {
            return {
                isValid: false,
                error: '消息长度不能超过500个字符'
            };
        }

        return {
            isValid: true
        };
    }

    /**
     * 获取对话历史
     * @returns {Array} 对话历史数组
     */
    getDialogueHistory() {
        return [...this.dialogueHistory];
    }

    /**
     * 清除对话历史
     */
    clearHistory() {
        try {
            this.dialogueHistory = [];
            this.storageManager.clearDialogueHistory();
            
            if (this.npcClient) {
                this.npcClient.clearHistory();
            }
            
            console.log('Dialogue history cleared');
        } catch (error) {
            console.error('Failed to clear dialogue history:', error);
            throw new Error('清除对话历史失败');
        }
    }

    /**
     * 获取对话统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        const playerMessages = this.dialogueHistory.filter(entry => entry.sender === 'player').length;
        const aiMessages = this.dialogueHistory.filter(entry => entry.sender === 'ai').length;
        const totalMessages = this.dialogueHistory.length;
        
        const firstMessage = this.dialogueHistory[0];
        const lastMessage = this.dialogueHistory[this.dialogueHistory.length - 1];
        
        return {
            totalMessages,
            playerMessages,
            aiMessages,
            firstMessageTime: firstMessage ? firstMessage.timestamp : null,
            lastMessageTime: lastMessage ? lastMessage.timestamp : null,
            isProcessing: this.isProcessing
        };
    }

    /**
     * 检查是否正在处理
     * @returns {boolean} 是否正在处理
     */
    isProcessingMessage() {
        return this.isProcessing;
    }

    /**
     * 获取NPC客户端（用于高级功能）
     * @returns {NPCClient} NPC客户端
     */
    getNPCClient() {
        return this.npcClient;
    }

    /**
     * 销毁对话系统
     */
    destroy() {
        try {
            if (this.npcClient) {
                // NPC客户端没有destroy方法，只需要清空引用
                this.npcClient = null;
            }
            
            this.sdk = null;
            this.dialogueHistory = [];
            this.isInitialized = false;
            this.isProcessing = false;
            
            console.log('Dialogue system destroyed');
        } catch (error) {
            console.error('Failed to destroy dialogue system:', error);
        }
    }
}