import { SDKConfig } from './types';
import { Logger } from './Logger';

export class SkeletonScreenMonitor {
  private config: SDKConfig;
  private onSkeletonDisappear: () => void;
  private logger: Logger;
  private isSkeletonScreenGone: boolean = false; // 确保回调只执行一次
  private observer: MutationObserver | null = null; // 保存 MutationObserver 实例
  private timeoutId: number | null = null; // 保存定时器 ID

  constructor(config: SDKConfig, onSkeletonDisappear: () => void, logger: Logger) {
    this.config = config;
    this.onSkeletonDisappear = onSkeletonDisappear;
    this.logger = logger;
  }

  // 监听骨架屏的消失
  waitForSkeletonToDisappear(): void {
    const skeleton = document.querySelector(this.config.skeletonSelector);

    if (!skeleton) {
      this.logger.info('No skeleton screen detected');
      this.triggerSkeletonDisappear(); // 没有检测到骨架屏时，直接调用回调

      return;
    }

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((removedNode) => {
          if (removedNode instanceof Element && removedNode.matches(this.config.skeletonSelector)) {
            this.logger.info('Skeleton screen disappeared');
            this.disconnectObserver(); // 骨架屏消失时断开 observer
            this.triggerSkeletonDisappear(); // 骨架屏消失时调用回调
          }
        });
      });
    });

    this.observer.observe(document.body, { childList: true, subtree: true });

    // 设置超时机制，如果骨架屏在最大等待时间内未消失，强制触发回调
    this.timeoutId = window.setTimeout(() => {
      this.disconnectObserver();

      if (!this.isSkeletonScreenGone) {
        this.logger.warn('Skeleton screen wait timeout');
        this.triggerSkeletonDisappear();
      }
    }, this.config.skeletonMaxWaitTime);
  }

  // 用于触发骨架屏消失的回调，并确保只触发一次
  private triggerSkeletonDisappear(): void {
    if (!this.isSkeletonScreenGone) {
      this.isSkeletonScreenGone = true;
      this.onSkeletonDisappear(); // 确保回调只执行一次
    }
  }

  // 断开 observer 并清除定时器
  disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.logger.info('Disconnected skeleton screen observer');
      this.observer = null;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.logger.info('Cleared skeleton screen timeout');
      this.timeoutId = null;
    }
  }
}
