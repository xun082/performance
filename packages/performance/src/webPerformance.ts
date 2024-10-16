import { getWebVitals, getResource } from './core/performance';
import { SdkBase, EVENT_TYPES, STATUS_CODE } from './types';
import { getTimestamp, _global, on } from './utils';

export default class WebPerformance {
  // 声明 type 属性，类型为字符串
  type: string;

  constructor() {
    // 为 type 属性赋值
    this.type = EVENT_TYPES.PERFORMANCE;
  }

  core({ transportData }: SdkBase) {
    // 获取 FCP、LCP、TTFB、FID 等 Web Vitals 指标并上报
    getWebVitals((res: any) => {
      const { name, rating, value } = res;
      transportData.send({
        type: EVENT_TYPES.PERFORMANCE,
        status: STATUS_CODE.OK,
        time: getTimestamp(),
        name,
        rating,
        value,
      });
    });

    // 监听长任务
    const observer = new PerformanceObserver((list) => {
      for (const longTask of list.getEntries()) {
        transportData.send({
          type: EVENT_TYPES.PERFORMANCE,
          name: 'longTask',
          longTask,
          time: getTimestamp(),
          status: STATUS_CODE.OK,
        });
      }
    });
    observer.observe({ entryTypes: ['longtask'] });

    // 页面加载完成时，发送资源列表
    on(_global, 'load', () => {
      transportData.send({
        type: EVENT_TYPES.PERFORMANCE,
        name: 'resourceList',
        time: getTimestamp(),
        status: STATUS_CODE.OK,
        resourceList: getResource(),
      });

      // 检查并发送内存信息，确保浏览器支持 performance.memory
      const performanceMemory = (performance as any).memory; // 使用类型断言

      if (performanceMemory) {
        transportData.send({
          type: EVENT_TYPES.PERFORMANCE,
          name: 'memory',
          time: getTimestamp(),
          status: STATUS_CODE.OK,
          memory: {
            jsHeapSizeLimit: performanceMemory.jsHeapSizeLimit,
            totalJSHeapSize: performanceMemory.totalJSHeapSize,
            usedJSHeapSize: performanceMemory.usedJSHeapSize,
          },
        });
      }
    });
  }
}
