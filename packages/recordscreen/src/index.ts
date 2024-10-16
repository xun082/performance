import { eventWithTime } from 'rrweb';

import ErrorTracker, { ErrorCallback, ErrorData } from './errors/errorTracker';
import UserBehaviorTracker, { EventCallback } from './behavior/userBehaviorTracker';
import ReplayBehavior from './behavior/replayBehavior';

interface MonitorOptions {
  errorTracker?: boolean;
  behaviorTracker?: boolean;
  sendErrorCallback?: ErrorCallback;
  sendEventCallback?: EventCallback;
  autoUploadErrors?: boolean; // 是否自动上报错误
  autoUploadInterval?: number; // 自动上报的时间间隔，单位为毫秒
  uploadEndpoint?: string; // 服务器上传 URL
}

class FrontendMonitor {
  private errorTracker: ErrorTracker | null;
  private behaviorTracker: UserBehaviorTracker | null;
  private options: MonitorOptions;
  private autoUploadTimer: number | null = null;
  private isRecording: boolean;
  private isReplaying: boolean;

  constructor(options: MonitorOptions = {}) {
    this.options = options;
    this.errorTracker = null;
    this.behaviorTracker = null;
    this.isRecording = false;
    this.isReplaying = false;
    this.init();
  }

  private init(): void {
    // 初始化错误监控
    if (this.options.errorTracker !== false) {
      this.errorTracker = new ErrorTracker(this.handleErrorUpload.bind(this));

      // 自动错误上报
      if (this.options.autoUploadErrors) {
        this.startAutoUploadErrors();
      }
    }

    // 初始化用户行为录制
    if (this.options.behaviorTracker !== false) {
      this.behaviorTracker = new UserBehaviorTracker(this.handleEventUpload.bind(this));
    }
  }

  // 开始录制用户行为
  public startRecording(): void {
    if (this.behaviorTracker && !this.isRecording) {
      this.behaviorTracker.startRecording();
      this.isRecording = true;
      console.log('User behavior recording started.');
    } else {
      console.warn('Recording is already in progress.');
    }
  }

  // 停止录制用户行为
  public stopRecording(): void {
    if (this.behaviorTracker && this.isRecording) {
      this.behaviorTracker.stopRecording();
      this.isRecording = false;
      console.log('User behavior recording stopped.');
    } else {
      console.warn('No recording in progress.');
    }
  }

  // 获取录制的事件
  public getEvents(): eventWithTime[] {
    if (this.behaviorTracker) {
      return this.behaviorTracker.getEvents();
    }

    return [];
  }

  // 开始用户行为回放
  public startReplay(container: HTMLElement): void {
    if (!this.isReplaying) {
      const events = this.getEvents();

      if (events.length > 0) {
        const replay = new ReplayBehavior(events);
        replay.startReplay(container);
        this.isReplaying = true;
        console.log('User behavior replay started.');
      } else {
        console.warn('No events recorded to replay.');
      }
    } else {
      console.warn('Replay is already in progress.');
    }
  }

  // 停止用户行为回放
  public stopReplay(): void {
    if (this.isReplaying) {
      this.isReplaying = false;
      console.log('User behavior replay stopped.');
    } else {
      console.warn('No replay in progress.');
    }
  }

  // 自动错误上报功能
  private startAutoUploadErrors(): void {
    if (this.options.autoUploadInterval && this.errorTracker) {
      this.autoUploadTimer = window.setInterval(() => {
        console.log('Auto uploading errors...');

        const errors = this.errorTracker?.getErrors();

        if (errors && errors.length > 0) {
          this.uploadToServer(errors, 'errors');
        }
      }, this.options.autoUploadInterval);
    }
  }

  // 停止自动上报错误
  public stopAutoUploadErrors(): void {
    if (this.autoUploadTimer) {
      clearInterval(this.autoUploadTimer);
      this.autoUploadTimer = null;
      console.log('Auto error upload stopped.');
    }
  }

  // 使用 fetch 上传到服务器
  private async uploadToServer(data: any, type: 'errors' | 'events'): Promise<void> {
    if (!this.options.uploadEndpoint) {
      console.warn('No upload endpoint provided.');

      return;
    }

    try {
      const response = await fetch(this.options.uploadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to upload ${type}: ${response.statusText}`);
      }

      console.log(`${type} uploaded successfully`);
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    }
  }

  // 错误上传处理
  private handleErrorUpload(errorData: ErrorData): void {
    console.log('Uploading error to server:', errorData);
    this.uploadToServer(errorData, 'errors');
  }

  // 用户行为上传处理
  private handleEventUpload(eventData: eventWithTime): void {
    console.log('Uploading event to server:', eventData);
    this.uploadToServer(eventData, 'events');
  }

  // 保存录制的用户行为事件到 localStorage
  public saveEvents(): void {
    const events = this.getEvents();

    if (events.length > 0) {
      localStorage.setItem('userBehaviorEvents', JSON.stringify(events));
      console.log('User behavior events saved to localStorage.');
    }
  }

  // 从 localStorage 中恢复录制的用户行为事件
  public loadEvents(): void {
    const storedEvents = localStorage.getItem('userBehaviorEvents');

    if (storedEvents) {
      const events: eventWithTime[] = JSON.parse(storedEvents);

      if (this.behaviorTracker) {
        events.forEach((event) => {
          this.behaviorTracker?.getEvents().push(event);
        });
        console.log('User behavior events loaded from localStorage.');
      }
    } else {
      console.warn('No events found in localStorage.');
    }
  }

  // 清除录制的用户行为事件
  public clearEvents(): void {
    if (this.behaviorTracker) {
      this.behaviorTracker.clearEvents();
      localStorage.removeItem('userBehaviorEvents');
      console.log('User behavior events cleared.');
    }
  }

  // 销毁前关闭所有定时器和录制
  public destroy(): void {
    this.stopRecording();
    this.stopReplay();
    this.stopAutoUploadErrors();
    console.log('FrontendMonitor instance destroyed.');
  }
}

export default FrontendMonitor;
