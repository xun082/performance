import { PageMonitor } from './PageMonitor';
import { SkeletonScreenMonitor } from './SkeletonScreenMonitor';
import { PerformanceMonitor } from './PerformanceMonitor';
import { SDKConfig } from './types';
import { Logger } from './Logger';

export class PageMonitorSDK {
  private config: SDKConfig;
  private pageMonitor: PageMonitor;
  private skeletonMonitor: SkeletonScreenMonitor;
  private performanceMonitor: PerformanceMonitor | null = null; // 性能监控延迟初始化
  private logger: Logger;
  private loadEventHandler: () => void;

  constructor(config: SDKConfig) {
    this.config = config;
    this.logger = new Logger(this.config);

    this.pageMonitor = new PageMonitor(this.config);
    this.skeletonMonitor = new SkeletonScreenMonitor(
      this.config,
      () => {
        this.logger.info('Starting page monitoring after skeleton screen disappeared');
        this.pageMonitor.startMonitoring(); // 骨架屏消失后开始页面监控
      },
      this.logger,
    );

    // 只有在启用性能监控的情况下才初始化 PerformanceMonitor
    if (this.config.enablePerformanceMonitoring) {
      this.performanceMonitor = new PerformanceMonitor(this.logger);
    }

    // 事件处理函数，保留引用以便后续清理
    this.loadEventHandler = () => {
      this.logger.info('Page loaded, waiting for skeleton screen');
      this.skeletonMonitor.waitForSkeletonToDisappear();

      // 如果启用了性能监控，记录性能数据
      if (this.performanceMonitor) {
        this.logger.info('Logging performance data...');
        this.performanceMonitor.logPerformanceData();
      }
    };
  }

  // 启动 SDK
  start(): void {
    this.logger.info('Starting SDK...');
    window.addEventListener('load', this.loadEventHandler);
  }

  // 停止 SDK
  stop(): void {
    this.logger.info('Stopping page monitoring and removing event listeners');

    // 清理 window.load 事件监听器
    window.removeEventListener('load', this.loadEventHandler);

    // 停止骨架屏监控（清理 MutationObserver 和定时任务）
    this.skeletonMonitor.disconnectObserver();

    // 停止页面监控
    this.pageMonitor.stopMonitoring();

    // 清理性能监控（如果存在）
    if (this.performanceMonitor) {
      this.logger.info('Stopping performance monitoring');
      // 如果有需要清理的性能监控逻辑，可以在这里处理
    }

    this.logger.info('SDK has been stopped.');
  }
}
