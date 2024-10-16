import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

import { Metric } from '../types';

type Callback = (metric: Metric) => void;

let firstScreenPaint = 0;
let isOnLoaded = false;
let timer: number;
let observer: MutationObserver;
let entries: any[] = [];

/**
 * 判断DOM是否在屏幕内
 * @param dom - 要判断的DOM元素
 * @returns 是否在屏幕内
 */
function isInScreen(dom: HTMLElement): boolean {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const rectInfo = dom.getBoundingClientRect();

  return rectInfo.left < viewportWidth && rectInfo.top < viewportHeight;
}

/**
 * 获取首屏渲染时间
 * @param callback - 回调函数
 */
export function getFirstScreenPaint(callback: Callback): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback((deadline) => {
      if (deadline.timeRemaining() > 0) {
        observeFirstScreenPaint(callback);
      }
    });
  } else {
    observeFirstScreenPaint(callback);
  }
}

/**
 * 监听首屏渲染时间
 * @param callback - 回调函数
 */
function observeFirstScreenPaint(callback: Callback): void {
  const ignoreDOMList = ['STYLE', 'SCRIPT', 'LINK'];
  observer = new MutationObserver((mutationList) => {
    checkDOMChange(callback);

    const entry = { children: [], startTime: 0 };

    for (const mutation of mutationList) {
      if (mutation.addedNodes.length && isInScreen(mutation.target as HTMLElement)) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (
            node.nodeType === 1 &&
            !ignoreDOMList.includes((node as HTMLElement).tagName) &&
            isInScreen(node as HTMLElement)
          ) {
            entry.children.push(node as never);
          }
        }
      }
    }

    if (entry.children.length) {
      entries.push(entry);
      entry.startTime = new Date().getTime();
    }
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  });
}

/**
 * 定时检查DOM变化，计算首屏时间
 * @param callback - 回调函数
 */
function checkDOMChange(callback: Callback) {
  cancelAnimationFrame(timer);
  timer = requestAnimationFrame(() => {
    if (document.readyState === 'complete') {
      isOnLoaded = true;
    }

    if (isOnLoaded) {
      if (observer) {
        observer.disconnect();
      }

      firstScreenPaint = getRenderTime();
      entries = [];
      callback({
        name: 'FSP',
        value: firstScreenPaint,
        rating: firstScreenPaint > 2500 ? 'poor' : 'good',
      });
    } else {
      checkDOMChange(callback);
    }
  });
}

/**
 * 计算首屏渲染时间
 * @returns 首屏渲染时间
 */
function getRenderTime(): number {
  let startTime = 0;
  entries.forEach((entry) => {
    if (entry.startTime > startTime) {
      startTime = entry.startTime;
    }
  });

  return startTime - performance.timing.navigationStart;
}

/**
 * 获取静态资源信息
 * @returns PerformanceResourceTiming数组
 */
export function getResource(): PerformanceResourceTiming[] {
  const entries = performance.getEntriesByType('resource');
  let list = entries.filter((entry) => {
    return ['fetch', 'xmlhttprequest', 'beacon'].indexOf(entry.initiatorType) === -1;
  }) as PerformanceResourceTiming[];

  if (list.length) {
    list = JSON.parse(JSON.stringify(list));
    list.forEach((entry: any) => {
      entry.isCache = isCache(entry);
    });
  }

  return list;
}

/**
 * 判断资源是否来自缓存
 * @param entry - 资源条目
 * @returns 是否来自缓存
 */
function isCache(entry: PerformanceResourceTiming): boolean {
  return entry.transferSize === 0 || (entry.transferSize !== 0 && entry.encodedBodySize === 0);
}

/**
 * Safari 浏览器判断
 * @returns 是否为Safari浏览器
 */
function isSafari(): boolean {
  return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
}

/**
 * 统一获取Web Vitals指标，并通过回调返回
 * @param callback - 回调函数
 */
export function getWebVitals(callback: Callback): void {
  if (isSafari()) {
    onINP((metric) => {
      // 使用 onINP 代替 onFID
      callback({ name: 'INP', value: metric.value, rating: metric.value > 100 ? 'poor' : 'good' });
    });
    onFCP((metric) => {
      callback({ name: 'FCP', value: metric.value, rating: metric.value > 2500 ? 'poor' : 'good' });
    });
    onLCP((metric) => {
      callback({ name: 'LCP', value: metric.value, rating: metric.value > 2500 ? 'poor' : 'good' });
    });
    onCLS((metric) => {
      callback({ name: 'CLS', value: metric.value, rating: metric.value > 0.1 ? 'poor' : 'good' });
    });
    onTTFB((metric) => {
      callback({ name: 'TTFB', value: metric.value, rating: metric.value > 100 ? 'poor' : 'good' });
    });
  } else {
    onCLS((metric) => {
      callback({ name: 'CLS', value: metric.value, rating: metric.value > 0.1 ? 'poor' : 'good' });
    });
    onINP((metric) => {
      // 使用 onINP 代替 onFID
      callback({ name: 'INP', value: metric.value, rating: metric.value > 100 ? 'poor' : 'good' });
    });
    onLCP((metric) => {
      callback({ name: 'LCP', value: metric.value, rating: metric.value > 2500 ? 'poor' : 'good' });
    });
    onFCP((metric) => {
      callback({ name: 'FCP', value: metric.value, rating: metric.value > 2500 ? 'poor' : 'good' });
    });
    onTTFB((metric) => {
      callback({ name: 'TTFB', value: metric.value, rating: metric.value > 100 ? 'poor' : 'good' });
    });
  }

  getFirstScreenPaint((metric) => {
    callback(metric);
  });
}
