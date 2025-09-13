export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogEntry {
  timestamp: string;
  service: string;
  level: string;
  message: string;
  stack?: string;
  [key: string]: any;
}

export interface LoggerConfig {
  level: LogLevel;
  service: string;
  isDevelopment: boolean;
  transports?: Transport[];
}

export interface Transport {
  type: 'console' | 'file' | 'cloudwatch' | 'elk' | 'loki' | 'datadog';
  options?: any;
}

export interface RequestLogData {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  statusCode?: number;
}