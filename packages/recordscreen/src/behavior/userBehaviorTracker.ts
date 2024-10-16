import { record, eventWithTime, recordOptions } from 'rrweb';

export type EventCallback = (event: eventWithTime) => void;
export type StatusChangeCallback = (status: 'started' | 'stopped') => void;

class UserBehaviorTracker {
  private events: eventWithTime[];
  private sendEventCallback: EventCallback;
  private stopFn: (() => void) | null;
  private isRecording: boolean;
  private maxEventLimit: number;
  private statusChangeCallback: StatusChangeCallback | null;

  constructor(
    sendEventCallback?: EventCallback,
    maxEventLimit: number = 1000, // 默认最大事件数
    statusChangeCallback?: StatusChangeCallback,
  ) {
    this.events = [];
    this.isRecording = false;
    this.stopFn = null;
    this.maxEventLimit = maxEventLimit;
    this.statusChangeCallback = statusChangeCallback || null;
    // 如果用户没有传递回调函数，使用默认的回调函数
    this.sendEventCallback = sendEventCallback || this.defaultSendEventCallback;
  }

  // 开始录制用户行为
  public startRecording(options: recordOptions<eventWithTime> = {}): void {
    if (this.isRecording) return;

    this.isRecording = true;

    // 触发状态变更回调
    this.notifyStatusChange('started');

    this.stopFn = record({
      emit: (event: eventWithTime) => {
        // 检查是否超过最大事件限制
        if (this.events.length >= this.maxEventLimit) {
          console.warn('Max event limit reached, stopping recording.');
          this.stopRecording();

          return;
        }

        // 检查去重
        if (this.isDuplicateEvent(event)) {
          console.log('Duplicate event detected, ignoring:', event);

          return;
        }

        // 添加事件并触发回调
        this.events.push(event);
        this.sendEventCallback(event);
      },
      ...options,
    });

    console.log('User behavior recording started.');
  }

  // 停止录制用户行为
  public stopRecording(): void {
    if (!this.isRecording) return;

    if (this.stopFn) {
      // 调用 stopFn 停止录制
      this.stopFn();
    }

    this.isRecording = false;

    // 触发状态变更回调
    this.notifyStatusChange('stopped');

    console.log('User behavior recording stopped.');
  }

  // 获取录制的事件
  public getEvents(): eventWithTime[] {
    return this.events;
  }

  // 将事件保存到 localStorage
  public saveEventsToLocalStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userEvents', JSON.stringify(this.events));
      console.log('Events saved to localStorage');
    }
  }

  // 从 localStorage 恢复事件
  public loadEventsFromLocalStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const storedEvents = localStorage.getItem('userEvents');

      if (storedEvents) {
        this.events = JSON.parse(storedEvents);
        console.log('Events loaded from localStorage');
      }
    }
  }

  // 清除录制的事件
  public clearEvents(): void {
    this.events = [];
    console.log('All recorded events have been cleared.');
  }

  // 默认的事件发送回调，可以被用户自定义覆盖
  private defaultSendEventCallback(event: eventWithTime): void {
    // 可以通过 AJAX 或 fetch 发送事件到服务器
    console.log('Sending event to server:', event);
  }

  // 检查是否重复事件（简单示例，您可以根据需求调整逻辑）
  private isDuplicateEvent(newEvent: eventWithTime): boolean {
    const lastEvent = this.events[this.events.length - 1];
    if (!lastEvent) return false;

    return JSON.stringify(newEvent) === JSON.stringify(lastEvent);
  }

  // 通知状态变更
  private notifyStatusChange(status: 'started' | 'stopped'): void {
    if (this.statusChangeCallback) {
      this.statusChangeCallback(status);
    }
  }
}

export default UserBehaviorTracker;
