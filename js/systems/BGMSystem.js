/**
 * BGM配乐系统
 * 负责游戏背景音乐的播放和管理
 */

class BGMSystem {
    constructor() {
        this.currentAudio = null;
        this.currentTrack = null;
        this.volume = 0.5;
        this.isMuted = false;
        this.isPlaying = false;
        this.fadeInterval = null;
        
        // BGM曲目配置
        // 把你的音乐文件放到 music/ 文件夹，然后在这里配置
        this.tracks = {
            // 主菜单音乐
            'menu': {
                src: 'music/menu.mp3',
                name: '主菜单',
                loop: true
            },
            // 日常场景
            'daily': {
                src: 'music/daily.mp3',
                name: '日常',
                loop: true
            },
            // 温馨场景
            'warm': {
                src: 'music/warm.mp3',
                name: '温馨',
                loop: true
            },
            // 紧张场景
            'tension': {
                src: 'music/tension.mp3',
                name: '紧张',
                loop: true
            },
            // 悲伤场景
            'sad': {
                src: 'music/sad.mp3',
                name: '悲伤',
                loop: true
            },
            // 浪漫场景
            'romantic': {
                src: 'music/romantic.mp3',
                name: '浪漫',
                loop: true
            },
            // 欢快场景
            'happy': {
                src: 'music/happy.mp3',
                name: '欢快',
                loop: true
            }
        };
        
        // 从localStorage加载设置
        this.loadSettings();
        
        console.log('🎵 BGM System initialized');
    }

    /**
     * 播放指定曲目
     * @param {string} trackId - 曲目ID
     * @param {boolean} fade - 是否淡入
     */
    play(trackId, fade = true) {
        const track = this.tracks[trackId];
        if (!track) {
            console.warn(`🎵 Track not found: ${trackId}`);
            return;
        }

        // 如果是同一首曲子且正在播放，不重复播放
        if (this.currentTrack === trackId && this.isPlaying) {
            console.log(`🎵 Track "${trackId}" is already playing`);
            return;
        }

        console.log(`🎵 Playing: ${track.name} (${trackId})`);

        // 如果有正在播放的音乐，先淡出
        if (this.currentAudio && this.isPlaying) {
            this.fadeOut(() => {
                this.startNewTrack(track, trackId, fade);
            });
        } else {
            this.startNewTrack(track, trackId, fade);
        }
    }

    /**
     * 开始播放新曲目
     */
    startNewTrack(track, trackId, fade) {
        // 创建新的Audio对象
        this.currentAudio = new Audio(track.src);
        this.currentAudio.loop = track.loop;
        this.currentTrack = trackId;

        // 设置音量
        if (fade) {
            this.currentAudio.volume = 0;
        } else {
            this.currentAudio.volume = this.isMuted ? 0 : this.volume;
        }

        // 播放
        this.currentAudio.play().then(() => {
            this.isPlaying = true;
            if (fade) {
                this.fadeIn();
            }
            console.log(`🎵 Now playing: ${track.name}`);
        }).catch(error => {
            console.warn('🎵 BGM autoplay blocked:', error.message);
            // 浏览器可能阻止自动播放，需要用户交互后才能播放
            this.setupAutoplayFix();
        });

        // 播放结束事件
        this.currentAudio.onended = () => {
            if (!track.loop) {
                this.isPlaying = false;
                console.log(`🎵 Track ended: ${track.name}`);
            }
        };

        // 错误处理
        this.currentAudio.onerror = (e) => {
            console.error(`🎵 Failed to load track: ${track.src}`, e);
        };
    }

    /**
     * 设置自动播放修复（用户交互后播放）
     */
    setupAutoplayFix() {
        const playOnInteraction = () => {
            if (this.currentAudio && !this.isPlaying) {
                this.currentAudio.play().then(() => {
                    this.isPlaying = true;
                    this.fadeIn();
                }).catch(() => {});
            }
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
        };

        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('keydown', playOnInteraction, { once: true });
    }

    /**
     * 停止播放
     * @param {boolean} fade - 是否淡出
     */
    stop(fade = true) {
        if (!this.currentAudio) return;

        if (fade) {
            this.fadeOut(() => {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                this.isPlaying = false;
                this.currentTrack = null;
            });
        } else {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.isPlaying = false;
            this.currentTrack = null;
        }

        console.log('🎵 BGM stopped');
    }

    /**
     * 暂停播放
     */
    pause() {
        if (this.currentAudio && this.isPlaying) {
            this.currentAudio.pause();
            this.isPlaying = false;
            console.log('🎵 BGM paused');
        }
    }

    /**
     * 恢复播放
     */
    resume() {
        if (this.currentAudio && !this.isPlaying) {
            this.currentAudio.play().then(() => {
                this.isPlaying = true;
                console.log('🎵 BGM resumed');
            }).catch(() => {});
        }
    }

    /**
     * 淡入效果
     * @param {number} duration - 淡入时长(ms)
     */
    fadeIn(duration = 1000) {
        if (!this.currentAudio || this.isMuted) return;

        clearInterval(this.fadeInterval);
        const targetVolume = this.volume;
        const step = targetVolume / (duration / 50);

        this.fadeInterval = setInterval(() => {
            if (this.currentAudio.volume < targetVolume - step) {
                this.currentAudio.volume += step;
            } else {
                this.currentAudio.volume = targetVolume;
                clearInterval(this.fadeInterval);
            }
        }, 50);
    }

    /**
     * 淡出效果
     * @param {Function} callback - 淡出完成后的回调
     * @param {number} duration - 淡出时长(ms)
     */
    fadeOut(callback, duration = 800) {
        if (!this.currentAudio) {
            if (callback) callback();
            return;
        }

        clearInterval(this.fadeInterval);
        const step = this.currentAudio.volume / (duration / 50);

        this.fadeInterval = setInterval(() => {
            if (this.currentAudio.volume > step) {
                this.currentAudio.volume -= step;
            } else {
                this.currentAudio.volume = 0;
                clearInterval(this.fadeInterval);
                if (callback) callback();
            }
        }, 50);
    }

    /**
     * 设置音量
     * @param {number} volume - 音量 (0-1)
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.currentAudio && !this.isMuted) {
            this.currentAudio.volume = this.volume;
        }
        this.saveSettings();
        console.log(`🎵 Volume set to: ${Math.round(this.volume * 100)}%`);
    }

    /**
     * 静音/取消静音
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.currentAudio) {
            this.currentAudio.volume = this.isMuted ? 0 : this.volume;
        }
        this.saveSettings();
        console.log(`🎵 Muted: ${this.isMuted}`);
        return this.isMuted;
    }

    /**
     * 设置静音状态
     * @param {boolean} muted - 是否静音
     */
    setMuted(muted) {
        this.isMuted = muted;
        if (this.currentAudio) {
            this.currentAudio.volume = this.isMuted ? 0 : this.volume;
        }
        this.saveSettings();
    }

    /**
     * 根据场景自动选择BGM
     * @param {string} scene - 场景描述
     */
    playForScene(scene) {
        const sceneLower = scene.toLowerCase();
        
        // 根据场景关键词选择BGM
        if (sceneLower.includes('menu') || sceneLower.includes('主菜单')) {
            this.play('menu');
        } else if (sceneLower.includes('sad') || sceneLower.includes('悲伤') || sceneLower.includes('难过')) {
            this.play('sad');
        } else if (sceneLower.includes('romantic') || sceneLower.includes('浪漫') || sceneLower.includes('爱')) {
            this.play('romantic');
        } else if (sceneLower.includes('tension') || sceneLower.includes('紧张') || sceneLower.includes('危险')) {
            this.play('tension');
        } else if (sceneLower.includes('happy') || sceneLower.includes('欢快') || sceneLower.includes('开心')) {
            this.play('happy');
        } else if (sceneLower.includes('warm') || sceneLower.includes('温馨') || sceneLower.includes('温暖')) {
            this.play('warm');
        } else {
            this.play('daily');
        }
    }

    /**
     * 根据AI回复内容智能切换BGM
     * @param {string} message - AI回复内容
     */
    analyzeAndPlay(message) {
        // 情感关键词检测
        const emotions = {
            'sad': ['难过', '伤心', '哭', '悲伤', '失落', '痛苦', '眼泪'],
            'romantic': ['喜欢', '爱', '心跳', '脸红', '害羞', '告白', '亲'],
            'tension': ['危险', '紧张', '害怕', '恐惧', '小心', '逃跑', '追'],
            'happy': ['开心', '高兴', '快乐', '哈哈', '太好了', '棒', '耶'],
            'warm': ['温暖', '感动', '谢谢', '陪伴', '安心', '幸福']
        };

        for (const [mood, keywords] of Object.entries(emotions)) {
            for (const keyword of keywords) {
                if (message.includes(keyword)) {
                    // 只有当情绪明显变化时才切换BGM
                    if (this.currentTrack !== mood) {
                        console.log(`🎵 Detected mood: ${mood}, switching BGM`);
                        this.play(mood);
                    }
                    return;
                }
            }
        }
    }

    /**
     * 获取当前状态
     */
    getStatus() {
        return {
            currentTrack: this.currentTrack,
            trackName: this.currentTrack ? this.tracks[this.currentTrack]?.name : null,
            isPlaying: this.isPlaying,
            volume: this.volume,
            isMuted: this.isMuted
        };
    }

    /**
     * 获取所有可用曲目
     */
    getTrackList() {
        return Object.entries(this.tracks).map(([id, track]) => ({
            id,
            name: track.name,
            src: track.src
        }));
    }

    /**
     * 保存设置到localStorage
     */
    saveSettings() {
        localStorage.setItem('bgm_settings', JSON.stringify({
            volume: this.volume,
            isMuted: this.isMuted
        }));
    }

    /**
     * 从localStorage加载设置
     */
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('bgm_settings'));
            if (settings) {
                this.volume = settings.volume ?? 0.5;
                this.isMuted = settings.isMuted ?? false;
            }
        } catch (e) {
            console.warn('🎵 Failed to load BGM settings');
        }
    }

    /**
     * 销毁系统
     */
    destroy() {
        this.stop(false);
        clearInterval(this.fadeInterval);
        this.currentAudio = null;
        console.log('🎵 BGM System destroyed');
    }
}
