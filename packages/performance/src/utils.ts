// 获取当前时间戳
export function getTimestamp(): number {
  return Date.now();
}

// 全局对象封装，适配浏览器和 Node.js 环境
// 针对浏览器和Node.js环境分别使用window和globalThis
export const _global = typeof window !== 'undefined' ? window : globalThis;

// 事件监听封装
export function on(target: any, event: string, handler: (e: any) => void) {
  if (target.addEventListener) {
    target.addEventListener(event, handler);
  } else if (target.attachEvent) {
    target.attachEvent('on' + event, handler);
  } else {
    target['on' + event] = handler;
  }
}
