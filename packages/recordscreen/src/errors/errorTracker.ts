// 定义捕获的错误数据类型
export interface ErrorData {
  type: 'jsError' | 'unhandledrejection' | 'resourceError';
  message?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  error?: string | null;
  reason?: any;
  target?: string;
}

export type ErrorCallback = (errorData: ErrorData) => void;

class ErrorTracker {
  private sendErrorCallback: ErrorCallback;
  private errorLogs: ErrorData[]; // 用于存储所有捕获的错误

  constructor(sendErrorCallback?: ErrorCallback) {
    // 初始化错误存储
    this.errorLogs = [];

    // 如果用户没有传递回调函数，使用默认的回调函数
    this.sendErrorCallback = sendErrorCallback || this.defaultSendErrorCallback;
    this.init();
  }

  private init(): void {
    // 捕获 JS 运行时错误
    window.onerror = (
      message: string,
      source: string,
      lineno: number,
      colno: number,
      error: Error | null,
    ) => {
      const errorData: ErrorData = {
        type: 'jsError',
        message,
        source,
        lineno,
        colno,
        error: error ? error.stack : null,
      };
      this.handleError(errorData);
    };

    // 捕获未处理的 Promise 错误
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const errorData: ErrorData = {
        type: 'unhandledrejection',
        reason: event.reason,
      };
      this.handleError(errorData);
    });

    // 捕获资源加载错误（图片、脚本等资源加载失败）
    window.addEventListener(
      'error',
      (event: Event) => {
        const target = event.target;

        // 确保 target 是 HTMLElement 并且不是 Window
        if (target instanceof HTMLElement) {
          let source = '';

          // 针对不同类型的 HTML 元素进行处理
          if (target instanceof HTMLImageElement) {
            source = target.src; // 图片加载错误
          } else if (target instanceof HTMLScriptElement) {
            source = target.src; // 脚本加载错误
          } else if (target instanceof HTMLLinkElement) {
            source = target.href; // 样式表或链接加载错误
          } else {
            source = target.outerHTML; // 其他类型元素
          }

          const errorData: ErrorData = {
            type: 'resourceError',
            target: target.outerHTML,
            source,
          };

          this.handleError(errorData);
        }
      },
      true,
    );
  }

  private handleError(errorData: ErrorData): void {
    console.error('Captured error:', errorData);

    // 将错误保存到 errorLogs
    this.errorLogs.push(errorData);

    // 调用错误发送回调
    this.sendErrorCallback(errorData);
  }

  private defaultSendErrorCallback(errorData: ErrorData): void {
    // 可以通过 AJAX 或 fetch 发送错误到服务器
    console.log('Sending error to server:', errorData);
  }

  // 获取所有捕获的错误
  public getErrors(): ErrorData[] {
    return this.errorLogs;
  }

  // 清除已存储的错误
  public clearErrors(): void {
    this.errorLogs = [];
    console.log('Error logs cleared.');
  }
}

export default ErrorTracker;
