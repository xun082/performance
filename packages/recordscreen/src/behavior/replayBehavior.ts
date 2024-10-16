import { Replayer, eventWithTime } from 'rrweb';

interface ReplayOptions {
  speed?: number; // 回放速度
  onReplayStart?: () => void; // 回放开始时的回调
  onReplayPause?: () => void; // 回放暂停时的回调
  onReplayResume?: () => void; // 回放恢复时的回调
  onReplayEnd?: () => void; // 回放结束时的回调
  enableAutoScroll?: boolean; // 是否启用自动滚动
}

class ReplayBehavior {
  private events: eventWithTime[];
  private rePlayer: Replayer | null = null;
  private isPlaying: boolean = false;
  private options: ReplayOptions;

  constructor(events: eventWithTime[], options?: ReplayOptions) {
    this.events = events;
    this.options = {
      speed: 1, // 默认回放速度为1倍
      enableAutoScroll: false, // 默认关闭自动滚动
      ...options,
    };
  }

  // 开始回放用户行为
  public startReplay(container: HTMLElement): void {
    if (!this.events || this.events.length === 0) {
      console.warn('No events to replay.');

      return;
    }

    if (this.isPlaying) {
      console.warn('Replay is already in progress.');

      return;
    }

    // 初始化 Replayer
    this.rePlayer = new Replayer(this.events, {
      root: container,
      speed: this.options.speed,
    });

    // 绑定回放事件
    this.bindReplayerEvents();

    // 开始回放
    this.rePlayer.play();
    this.isPlaying = true;

    console.log('User behavior replay started.');

    // 触发回放开始的回调
    if (this.options.onReplayStart) {
      this.options.onReplayStart();
    }

    // 如果启用了自动滚动，启动自动滚动逻辑
    if (this.options.enableAutoScroll) {
      this.startAutoScroll();
    }
  }

  // 暂停回放
  public pauseReplay(): void {
    if (this.rePlayer && this.isPlaying) {
      this.rePlayer.pause();
      this.isPlaying = false;
      console.log('User behavior replay paused.');

      // 触发回放暂停的回调
      if (this.options.onReplayPause) {
        this.options.onReplayPause();
      }
    }
  }

  // 继续回放
  public resumeReplay(): void {
    if (this.rePlayer && !this.isPlaying) {
      this.rePlayer.play();
      this.isPlaying = true;
      console.log('User behavior replay resumed.');

      // 触发回放恢复的回调
      if (this.options.onReplayResume) {
        this.options.onReplayResume();
      }
    }
  }

  // 停止回放
  public stopReplay(): void {
    if (this.rePlayer) {
      this.rePlayer.pause(); // 停止播放
      this.rePlayer = null; // 销毁 Replayer 实例
      this.isPlaying = false;
      console.log('User behavior replay stopped.');

      // 触发回放结束的回调
      if (this.options.onReplayEnd) {
        this.options.onReplayEnd();
      }
    }
  }

  // 调整回放速度
  public setSpeed(speed: number): void {
    if (this.rePlayer) {
      this.rePlayer.setConfig({ speed });
      console.log(`Replay speed set to ${speed}x`);
    }
  }

  // 启动自动滚动逻辑
  private startAutoScroll(): void {
    const scrollStep = 10; // 每次滚动的距离
    const scrollInterval = 100; // 每100ms滚动一次

    const scrollContainer = document.documentElement || document.body;

    const autoScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      const scrollHeight = scrollContainer.scrollHeight;
      const clientHeight = scrollContainer.clientHeight;

      // 如果还没有到达页面底部，继续滚动
      if (scrollTop + clientHeight < scrollHeight) {
        scrollContainer.scrollTop += scrollStep;
        setTimeout(autoScroll, scrollInterval);
      }
    };

    autoScroll();
  }

  // 绑定回放事件
  private bindReplayerEvents(): void {
    if (!this.rePlayer) return;

    // 监听 Replayer 的回放结束事件
    this.rePlayer.on('finish', () => {
      console.log('Replay has finished.');
      this.isPlaying = false;

      // 触发回放结束的回调
      if (this.options.onReplayEnd) {
        this.options.onReplayEnd();
      }
    });

    // 其他事件监听可以在这里扩展
  }
}

export default ReplayBehavior;
