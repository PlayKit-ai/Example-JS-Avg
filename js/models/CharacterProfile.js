/**
 * 角色设定数据模型和验证逻辑
 */

class CharacterProfile {
    constructor(data = {}) {
        this.nickname = data.nickname || '';
        this.gender = data.gender || '';
        this.personality = data.personality || '';
        this.identity = data.identity || '';
        this.background = data.background || '';
        
        // 玩家角色新增字段
        this.character = data.character || '';
        this.traits = data.traits || '';
        
        // AI角色专用字段
        this.appearance = data.appearance || '';
        this.settings = data.settings || '';
        this.opening = data.opening || '';
        
        // 保留兼容性字段
        this.chatStyle = data.chatStyle || '';
        this.relationship = data.relationship || '';
        this.outfit = data.outfit || '';
    }

    /**
     * 验证玩家角色数据
     * @param {Object} data - 角色数据
     * @returns {ValidationResult} 验证结果
     */
    static validatePlayerProfile(data) {
        const errors = {};
        let isValid = true;

        // 验证昵称
        if (!data.nickname || data.nickname.trim().length === 0) {
            errors.nickname = '请输入昵称';
            isValid = false;
        } else if (data.nickname.trim().length > 20) {
            errors.nickname = '昵称不能超过20个字符';
            isValid = false;
        }

        // 验证性别
        if (!data.gender || !['male', 'female', 'other'].includes(data.gender)) {
            errors.gender = '请选择性别';
            isValid = false;
        }

        // 验证人设
        if (!data.personality || data.personality.trim().length === 0) {
            errors.personality = '请描述人设';
            isValid = false;
        } else if (data.personality.trim().length > 200) {
            errors.personality = '人设描述不能超过200个字符';
            isValid = false;
        }

        // 验证身份
        if (!data.identity || data.identity.trim().length === 0) {
            errors.identity = '请输入身份';
            isValid = false;
        } else if (data.identity.trim().length > 50) {
            errors.identity = '身份描述不能超过50个字符';
            isValid = false;
        }

        // 验证性格
        if (!data.character || data.character.trim().length === 0) {
            errors.character = '请描述性格';
            isValid = false;
        } else if (data.character.trim().length > 50) {
            errors.character = '性格描述不能超过50个字符';
            isValid = false;
        }

        // 验证特质
        if (!data.traits || data.traits.trim().length === 0) {
            errors.traits = '请描述特质';
            isValid = false;
        } else if (data.traits.trim().length > 50) {
            errors.traits = '特质描述不能超过50个字符';
            isValid = false;
        }

        // 验证世界观
        if (!data.background || data.background.trim().length === 0) {
            errors.background = '请描述世界观';
            isValid = false;
        } else if (data.background.trim().length > 300) {
            errors.background = '世界观描述不能超过300个字符';
            isValid = false;
        }

        return {
            isValid,
            errors
        };
    }

    /**
     * 验证AI角色数据
     * @param {Object} data - AI角色数据
     * @returns {ValidationResult} 验证结果
     */
    static validateAIProfile(data) {
        const errors = {};
        let isValid = true;

        // 验证昵称
        if (!data.nickname || data.nickname.trim().length === 0) {
            errors.nickname = '请输入昵称';
            isValid = false;
        } else if (data.nickname.trim().length > 20) {
            errors.nickname = '昵称不能超过20个字符';
            isValid = false;
        }

        // 验证性别
        if (!data.gender || !['male', 'female', 'other'].includes(data.gender)) {
            errors.gender = '请选择性别';
            isValid = false;
        }

        // 验证人设（可选字段）
        if (data.personality && data.personality.trim().length > 200) {
            errors.personality = '人设描述不能超过200个字符';
            isValid = false;
        }

        // 验证身份（可选字段）
        if (data.identity && data.identity.trim().length > 50) {
            errors.identity = '身份描述不能超过50个字符';
            isValid = false;
        }

        // 验证世界观（可选字段）
        if (data.background && data.background.trim().length > 300) {
            errors.background = '世界观描述不能超过300个字符';
            isValid = false;
        }

        // 验证设定
        if (!data.settings || data.settings.trim().length === 0) {
            errors.settings = '请描述AI角色设定';
            isValid = false;
        } else if (data.settings.trim().length > 500) {
            errors.settings = '设定描述不能超过500个字符';
            isValid = false;
        }

        // 验证外观描述
        if (!data.appearance || data.appearance.trim().length === 0) {
            errors.appearance = '请描述外观特征';
            isValid = false;
        } else if (data.appearance.trim().length > 300) {
            errors.appearance = '外观描述不能超过300个字符';
            isValid = false;
        }

        // 验证开场白
        if (!data.opening || data.opening.trim().length === 0) {
            errors.opening = '请输入开场白';
            isValid = false;
        } else if (data.opening.trim().length > 200) {
            errors.opening = '开场白不能超过200个字符';
            isValid = false;
        }

        return {
            isValid,
            errors
        };
    }

    /**
     * 创建玩家角色实例
     * @param {Object} data - 角色数据
     * @returns {CharacterProfile} 角色实例
     */
    static createPlayerProfile(data) {
        const validation = this.validatePlayerProfile(data);
        if (!validation.isValid) {
            throw new Error('Invalid player profile data');
        }

        return new CharacterProfile({
            nickname: data.nickname.trim(),
            gender: data.gender,
            personality: data.personality.trim(),
            identity: data.identity.trim(),
            character: data.character.trim(),
            traits: data.traits.trim(),
            background: data.background.trim()
        });
    }

    /**
     * 创建AI角色实例
     * @param {Object} data - AI角色数据
     * @returns {CharacterProfile} AI角色实例
     */
    static createAIProfile(data) {
        const validation = this.validateAIProfile(data);
        if (!validation.isValid) {
            throw new Error('Invalid AI profile data');
        }

        return new CharacterProfile({
            nickname: data.nickname.trim(),
            gender: data.gender,
            personality: data.personality ? data.personality.trim() : '',
            identity: data.identity ? data.identity.trim() : '',
            background: data.background ? data.background.trim() : '',
            settings: data.settings.trim(),
            appearance: data.appearance.trim(),
            opening: data.opening.trim()
        });
    }

    /**
     * 转换为JSON对象
     * @returns {Object} JSON对象
     */
    toJSON() {
        return {
            nickname: this.nickname,
            gender: this.gender,
            personality: this.personality,
            identity: this.identity,
            character: this.character,
            traits: this.traits,
            background: this.background,
            appearance: this.appearance,
            settings: this.settings,
            opening: this.opening,
            // 保留兼容性字段
            chatStyle: this.chatStyle,
            relationship: this.relationship,
            outfit: this.outfit
        };
    }

    /**
     * 从JSON对象创建实例
     * @param {Object} json - JSON对象
     * @returns {CharacterProfile} 角色实例
     */
    static fromJSON(json) {
        return new CharacterProfile(json);
    }

    /**
     * 生成AI角色的系统提示词 - 极简直接版本
     * @returns {string} 系统提示词
     */
    generateSystemPrompt() {
        if (!this.appearance) {
            throw new Error('This is not an AI character profile');
        }
        
        return `你现在是${this.nickname}，不是AI助手。

角色背景：${this.settings}

【绝对禁止】
- 禁止说"好的"、"需要"、"可以"开头
- 禁止分析角色、分析场景、分析任务
- 禁止说"作为"、"根据"、"设定"、"规则"
- 禁止用第三人称描述自己
- 禁止解释你要做什么

【必须遵守】
- 直接用${this.nickname}的身份说话
- 像真人聊天一样简短自然
- 用"我"称呼自己
- 回复控制在30字以内

【回复格式】
只输出${this.nickname}说的话，可以加动作描写如（笑）、*歪头*

错误示范：好的，需要构建一个自然的对话场景...
正确示范：诶？你怎么来了呀~（惊喜地看着你）

现在用户对你说话，直接回应：`;
    }

    /**
     * 生成图像生成提示词
     * @returns {string} 图像提示词
     */
    generateImagePrompt() {
        if (!this.appearance) {
            throw new Error('This is not an AI character profile');
        }

        const genderText = this.gender === 'male' ? 'male' : this.gender === 'female' ? 'female' : 'person';
        
        return `1${genderText}, ${this.appearance}, anime character portrait, solo, transparent background, no background, white background, character only, full body, high quality anime art, visual novel style, standing pose, isolated character, PNG with transparency, cutout style, clean background removal, professional character design, white backdrop for easy removal`;
    }
}

/**
 * 验证结果类型定义
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - 是否有效
 * @property {Object} errors - 错误信息对象
 */