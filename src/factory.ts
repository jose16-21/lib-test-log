import winston from 'winston';
import { Logger } from './logger';
import { LoggerConfig, Transport } from './types';

export function createCustomLogger(config: Partial<LoggerConfig>): any {
  return new (Logger as any)(config);
}

// Factory para crear transports personalizados
export class TransportFactory {
  static createCloudWatchTransport(options: any): winston.transport {
    // Placeholder para futuro transport de CloudWatch
    // Requeriría winston-cloudwatch como dependencia
    throw new Error('CloudWatch transport not implemented yet');
  }

  static createELKTransport(options: any): winston.transport {
    // Placeholder para futuro transport de ELK
    // Requeriría winston-elasticsearch como dependencia
    throw new Error('ELK transport not implemented yet');
  }

  static createLokiTransport(options: any): winston.transport {
    // Placeholder para futuro transport de Loki
    // Requeriría winston-loki como dependencia
    throw new Error('Loki transport not implemented yet');
  }

  static createDatadogTransport(options: any): winston.transport {
    // Placeholder para futuro transport de Datadog
    // Requeriría winston-datadog como dependencia
    throw new Error('Datadog transport not implemented yet');
  }

  static createFileTransport(options: { filename: string; maxSize?: string; maxFiles?: string }): winston.transport {
    const DailyRotateFile = require('winston-daily-rotate-file');
    return new DailyRotateFile({
      filename: options.filename,
      datePattern: 'YYYY-MM-DD',
      maxSize: options.maxSize || '20m',
      maxFiles: options.maxFiles || '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    });
  }
}