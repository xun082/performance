// 定义接口，用于封装性能数据
export interface Metric {
  name: string;
  value: number;
  rating: string; // 'good' | 'poor'
}

export interface SdkBase {
  transportData: {
    send: (data: any) => void;
  };
}

export enum EVENT_TYPES {
  PERFORMANCE = 'performance',
}

export enum STATUS_CODE {
  OK = 200,
}
