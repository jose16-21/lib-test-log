import winston from 'winston';
import { LogLevel, LoggerConfig, LogEntry } from './types';

class Logger {
  private winstonLogger: winston.Logger;
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: this.getLogLevel(),
      service: this.getServiceName(),
      isDevelopment: this.isDevelopment(),
      ...config
    };

    this.winstonLogger = this.createWinstonLogger();
  }

  private getLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLevel) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private getServiceName(): string {
    return process.env.SERVICE_NAME || 'unknown-service';
  }

  private isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
  }

  private createWinstonLogger(): winston.Logger {
    const formats = [
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ];

    // En desarrollo, agregar colores
    if (this.config.isDevelopment) {
      formats.unshift(winston.format.colorize({ all: true }));
      formats.push(
        winston.format.printf((info) => {
          const { timestamp, level, message, service, stack, ...meta } = info;
          let logMessage = `${timestamp} [${service}] ${level}: ${message}`;
          
          if (Object.keys(meta).length > 0) {
            logMessage += `\n${JSON.stringify(meta, null, 2)}`;
          }
          
          if (stack) {
            logMessage += `\n${stack}`;
          }
          
          return logMessage;
        })
      );
    }

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(...formats)
      })
    ];

    return winston.createLogger({
      level: this.config.level,
      format: winston.format.combine(...formats),
      defaultMeta: { service: this.config.service },
      transports
    });
  }

  private formatLogEntry(level: string, message: string, meta?: any, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      service: this.config.service,
      level,
      message
    };

    if (error && error.stack) {
      entry.stack = error.stack;
    }

    if (meta && typeof meta === 'object') {
      Object.assign(entry, meta);
    }

    return entry;
  }

  error(message: string, error?: Error | any, meta?: any): void {
    if (error instanceof Error) {
      this.winstonLogger.error(message, { stack: error.stack, ...meta });
    } else if (error && typeof error === 'object') {
      this.winstonLogger.error(message, error);
    } else {
      this.winstonLogger.error(message, meta);
    }
  }

  warn(message: string, meta?: any): void {
    this.winstonLogger.warn(message, meta);
  }

  info(message: string, meta?: any): void {
    this.winstonLogger.info(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.winstonLogger.debug(message, meta);
  }

  // Método para agregar transports personalizados en el futuro
  addTransport(transport: winston.transport): void {
    this.winstonLogger.add(transport);
  }

  // Método para obtener la configuración actual
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Instancia singleton del logger
export const logger = new Logger();