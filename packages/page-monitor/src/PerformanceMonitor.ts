import { PerformanceData } from './types';
import { Logger } from './Logger';

export class PerformanceMonitor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // 获取性能数据
  getPerformanceData(): PerformanceData | null {
    const [navigationEntry] = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];

    if (!navigationEntry) {
      this.logger.warn('No navigation performance entry found.');

      return null;
    }

    // 获取 first-paint 和 first-contentful-paint
    const firstPaint = performance.getEntriesByName('first-paint')[0]?.startTime || 0;
    const firstContentfulPaint =
      performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;

    // 返回性能数据
    return {
      loadTime: navigationEntry.loadEventEnd - navigationEntry.startTime,
      domContentLoadedTime: navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime,
      firstPaint,
      firstContentfulPaint,
    };
  }

  // 打印性能数据（可以结合 Logger 输出）
  logPerformanceData(): void {
    const data = this.getPerformanceData();

    if (data) {
      this.logger.info('Performance data:', data);
    } else {
      this.logger.warn('No performance data could be retrieved.');
    }
  }
}
