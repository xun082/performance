import { ElementSample, SDKConfig, SampleData } from './types';
import { delay } from './utils';
import { Logger } from './Logger';

export class PageMonitor {
  private config: SDKConfig;
  private initialSample: SampleData | null = null;
  private retryCount: number = 0;
  private logger: Logger;
  private emptyPoints: number = 0;
  private threshold: number = 5; // 白屏检测阈值，可以根据页面结构调整
  private monitoring: boolean = true; // 监控状态标志位，用于停止监控时使用
  private observerTimeout: number | null = null; // 用于保存定时器 ID

  constructor(config: SDKConfig) {
    this.config = config;
    this.logger = new Logger(config);
  }

  // 判断元素是否是容器
  private isContainer(element: HTMLElement): boolean {
    if (!element) return false;

    return ['DIV', 'SECTION', 'MAIN', 'HEADER', 'FOOTER'].includes(element.tagName);
  }

  // 获取元素的样本数据
  private getElementSample(element: Element | null): ElementSample | null {
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    return {
      tagName: element.tagName,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      backgroundColor: computedStyle.backgroundColor,
      fontSize: computedStyle.fontSize,
      text: element.textContent?.trim() || '',
      visibility: computedStyle.visibility,
      display: computedStyle.display,
    };
  }

  // 采样逻辑，包括垂直、水平、对角线采样
  samplePage(): SampleData {
    const sampleData: SampleData = {};
    this.emptyPoints = 0; // 每次采样前重置 emptyPoints，避免累积

    // 垂直交叉采样
    for (let i = 1; i <= 9; i++) {
      // x轴采样点
      const xElements = document?.elementsFromPoint(
        (window.innerWidth * i) / 10,
        window.innerHeight / 2,
      );
      // y轴采样点
      const yElements = document?.elementsFromPoint(
        window.innerWidth / 2,
        (window.innerHeight * i) / 10,
      );
      // 上升的对角线采样点
      const upDiagonalElements = document?.elementsFromPoint(
        (window.innerWidth * i) / 10,
        (window.innerHeight * i) / 10,
      );
      // 下降的对角线采样点
      const downDiagonalElements = document?.elementsFromPoint(
        (window.innerWidth * i) / 10,
        window.innerHeight - (window.innerHeight * i) / 10,
      );

      // 针对每个方向的采样进行数据获取
      sampleData[`xElement_${i}`] = this.getElementSample(xElements[0]);
      sampleData[`yElement_${i}`] = this.getElementSample(yElements[0]);
      sampleData[`upDiagonalElement_${i}`] = this.getElementSample(upDiagonalElements[0]);
      sampleData[`downDiagonalElement_${i}`] = this.getElementSample(downDiagonalElements[0]);

      // 判断是否为有效容器元素，计算空点数量
      if (!this.isContainer(xElements[0] as HTMLElement)) this.emptyPoints++;

      if (i !== 5) {
        // 避免中心点重复计算
        if (!this.isContainer(yElements[0] as HTMLElement)) this.emptyPoints++;
        if (!this.isContainer(upDiagonalElements[0] as HTMLElement)) this.emptyPoints++;
        if (!this.isContainer(downDiagonalElements[0] as HTMLElement)) this.emptyPoints++;
      }
    }

    // 检查空点数量是否超过阈值，超过则报告白屏
    if (this.emptyPoints > this.threshold) {
      this.reportWhiteScreen();
    }

    return sampleData;
  }

  // 比较两个采样数据
  compareSamples(oldSample: SampleData, newSample: SampleData): boolean {
    return Object.keys(oldSample).some((key) => {
      const oldElement = oldSample[key];
      const newElement = newSample[key];
      if (!oldElement || !newElement) return true;

      return (
        oldElement.width !== newElement.width ||
        oldElement.height !== newElement.height ||
        oldElement.top !== newElement.top ||
        oldElement.left !== newElement.left ||
        oldElement.backgroundColor !== newElement.backgroundColor ||
        oldElement.fontSize !== newElement.fontSize ||
        oldElement.text !== newElement.text ||
        oldElement.visibility !== newElement.visibility ||
        oldElement.display !== newElement.display
      );
    });
  }

  // 上报异常
  reportAnomaly(newSample: SampleData): void {
    if (this.config.onError) {
      this.config.onError(newSample);
    }

    fetch(this.config.reportUrl, {
      method: 'POST',
      body: JSON.stringify({
        error: 'Page anomaly detected',
        sample: newSample,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
      headers: { 'Content-Type': 'application/json' },
    }).then(() => this.logger.info('Anomaly reported successfully'));
  }

  // 上报白屏情况
  reportWhiteScreen(): void {
    this.logger.error('白屏检测：页面渲染失败或关键元素缺失');
    // 这里可以通过 fetch 或者其他方式上报白屏问题
  }

  // 重试逻辑
  async retrySampling(): Promise<void> {
    while (this.retryCount < (this.config.maxRetries || 3) && this.monitoring) {
      await delay(this.config.retryInterval || 1000);
      this.retryCount++;
      this.logger.info(`Retrying... attempt ${this.retryCount}`);

      const newSample = this.samplePage();
      const hasChanges = this.compareSamples(this.initialSample!, newSample);

      if (hasChanges) {
        this.logger.info('Page layout changed on retry');
        this.reportAnomaly(newSample);

        return;
      }
    }

    this.logger.warn('Max retries reached, stopping retry attempts');
  }

  // 停止监控
  stopMonitoring(): void {
    this.monitoring = false;

    if (this.observerTimeout) {
      clearTimeout(this.observerTimeout); // 清理定时器
      this.logger.info('Cleared retry timeout');
    }

    this.logger.info('Page monitoring stopped.');
  }

  // 开始监控
  startMonitoring(): void {
    this.monitoring = true;
    requestIdleCallback(() => {
      if (!this.monitoring) return; // 如果监控已被停止，直接退出

      if (!this.initialSample) {
        this.initialSample = this.samplePage();
        this.logger.debug('Initial sample taken', this.initialSample);
      } else {
        const newSample = this.samplePage();
        const hasChanges = this.compareSamples(this.initialSample, newSample);

        if (hasChanges) {
          this.logger.info('Page layout has changed');
          this.reportAnomaly(newSample);
          this.retrySampling(); // 开启重试
        }
      }
    });
  }
}
