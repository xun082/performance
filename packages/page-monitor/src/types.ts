// 关键点配置类型
export interface KeyPoint {
  selector: string; // DOM 选择器
  name: string; // 该关键点的名称
}

// SDK 配置类型
export interface SDKConfig {
  keyPoints: KeyPoint[]; // 关键点配置
  skeletonSelector: string; // 骨架屏的选择器
  skeletonMaxWaitTime: number; // 骨架屏消失的最大等待时间
  reportUrl: string; // 异常上报接口
  maxRetries?: number; // 自动重试的最大次数
  retryInterval?: number; // 每次重试的间隔时间
  enablePerformanceMonitoring?: boolean; // 是否开启性能监控
  debug?: boolean; // 是否启用调试模式
  logLevel?: 'debug' | 'info' | 'warn' | 'error'; // 日志级别
  onError?: (errorInfo: any) => void; // 自定义异常处理
}

// 元素采样数据类型
export interface ElementSample {
  tagName: string;
  width: number;
  height: number;
  top: number;
  left: number;
  backgroundColor: string;
  fontSize: string;
  text: string;
  visibility: string;
  display: string;
}

// 采样数据类型
export interface SampleData {
  [key: string]: ElementSample | null;
}

// 性能数据类型
export interface PerformanceData {
  loadTime: number; // 页面加载时间
  domContentLoadedTime: number; // DOM 内容加载完成时间
  firstPaint: number; // 首次绘制时间
  firstContentfulPaint: number; // 首次内容绘制时间
}
