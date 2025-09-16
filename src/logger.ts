import winston from 'winston';
import { ENV_KEYS, DEFAULTS } from './constants';
import { LogLevel, Environment, OutputFormat, SupportedLang } from './types';
import { LoggerConfig, LogEntry, HttpStatusCode, ApplicationErrorCode, ErrorContext } from './types';
import { XmlProcessor } from './xml';
import { translate } from './i18n';

export class Logger {
  private winstonLogger: winston.Logger;
  private config: LoggerConfig & {
    environment: string;
    outputFormat: OutputFormat;
    lang: SupportedLang;
  };
  private xmlProcessor: XmlProcessor;

  constructor(config?: Partial<LoggerConfig> & {
    lang?: SupportedLang;
    environment?: string;
    outputFormat?: OutputFormat;
  }, transports?: winston.transport[]) {
    const envEnvironment = process.env[ENV_KEYS.NODE_ENV] || DEFAULTS.NODE_ENV;
    const envLang = (process.env[ENV_KEYS.LOG_LANG] as SupportedLang | undefined) || SupportedLang[DEFAULTS.LOG_LANG.toUpperCase() as keyof typeof SupportedLang];
    const envOutputFormat = (process.env[ENV_KEYS.LOG_FORMAT] as OutputFormat) || OutputFormat[DEFAULTS.LOG_FORMAT.toUpperCase() as keyof typeof OutputFormat];
    this.config = {
      level: this.getLogLevel(),
      service: this.getServiceName(),
      isDevelopment: this.isDevelopment(),
      environment: config?.environment || envEnvironment,
      lang: config?.lang || envLang,
      outputFormat: config?.outputFormat || envOutputFormat,
      ...config
    };
    this.winstonLogger = this.createWinstonLogger(transports);
    this.xmlProcessor = new XmlProcessor();
  }

  // Log con soporte i18n
  logI18n(level: LogLevel, key: string, params?: Record<string, any>, meta?: any): void {
    const message = translate(this.config.lang, key, params);
    switch (level) {
      case LogLevel.ERROR:
        this.error(message, undefined, meta);
        break;
      case LogLevel.WARN:
        this.warn(message, meta);
        break;
      case LogLevel.DEBUG:
        this.debug(message, meta);
        break;
      default:
        this.info(message, meta);
    }
  }

  /**
   * Procesa y loguea XML. Si el XML es válido, lo parsea y lo loguea al nivel indicado.
   * Si es inválido o ocurre un error, lo loguea como error.
   */
  logXml(xmlString: string, level: LogLevel = LogLevel.INFO, meta?: any): void {
    let parsed: any = null;
    let valid: boolean = false;
    try {
      valid = this.xmlProcessor.validate(xmlString);
      if (valid) {
        parsed = this.xmlProcessor.parse(xmlString);
        let output;
        if (this.config.outputFormat === OutputFormat.XML) {
          output = this.xmlProcessor.build(parsed);
        } else {
          output = parsed;
        }
        switch (level) {
          case LogLevel.ERROR:
            this.error("XML procesado correctamente", undefined, { xml: output, ...meta });
            break;
          case LogLevel.WARN:
            this.warn("XML procesado correctamente", { xml: output, ...meta });
            break;
          case LogLevel.DEBUG:
            this.debug("XML procesado correctamente", { xml: output, ...meta });
            break;
          default:
            this.info("XML procesado correctamente", { xml: output, ...meta });
        }
      } else {
        this.error("XML inválido", undefined, { xml: xmlString, ...meta });
      }
    } catch (err) {
      this.error("Error procesando XML", undefined, { error: err, xml: xmlString, ...meta });
    }
  }

  private getLogLevel(): LogLevel {
    const envLevel = process.env[ENV_KEYS.LOG_LEVEL]?.toLowerCase();
    switch (envLevel) {
      case LogLevel.ERROR:
        return LogLevel.ERROR;
      case LogLevel.WARN:
        return LogLevel.WARN;
      case LogLevel.INFO:
        return LogLevel.INFO;
      case LogLevel.DEBUG:
        return LogLevel.DEBUG;
      default:
        return LogLevel[DEFAULTS.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel];
    }
  }

  private getServiceName(): string {
    return process.env[ENV_KEYS.SERVICE_NAME] || DEFAULTS.SERVICE_NAME;
  }

  private isDevelopment(): boolean {
    return process.env[ENV_KEYS.NODE_ENV] !== Environment.PRODUCTION;
  }

  private createWinstonLogger(customTransports?: winston.transport[]): winston.Logger {
    const chalk = require('chalk');
    const formats = [
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true })
    ];

    // Formato personalizado con colores y prefijos
    formats.push(
      winston.format.printf((info) => {
        const { timestamp, level, message, service, environment, stack, ...meta } = info;
        let levelPrefix = '';
        let colorFn = (txt: string) => txt;
        switch (level) {
          case 'error':
            levelPrefix = '[ERROR]';
            colorFn = chalk.red;
            break;
          case 'warn':
            levelPrefix = '[WARN]';
            colorFn = chalk.yellow;
            break;
          case 'info':
            levelPrefix = '[INFO]';
            colorFn = chalk.green;
            break;
          case 'debug':
            levelPrefix = '[DEBUG]';
            colorFn = chalk.cyan;
            break;
          default:
            levelPrefix = `[${level.toUpperCase()}]`;
        }
  const envStr = typeof environment === 'string' ? environment : String(environment || process.env[ENV_KEYS.NODE_ENV] || DEFAULTS.NODE_ENV);
  let logMessage = `${colorFn(String(levelPrefix))} [${envStr}] ${timestamp} [${service}]: ${colorFn(String(message))}`;
        if (Object.keys(meta).length > 0) {
          logMessage += `\n${chalk.gray(JSON.stringify(meta, null, 2))}`;
        }
        if (stack) {
          logMessage += `\n${chalk.magenta(stack)}`;
        }
        return logMessage;
      })
    );

    let transports: winston.transport[] = [];
    if (customTransports && customTransports.length > 0) {
      transports = customTransports;
    } else if (process.env.NODE_ENV === 'test') {
      transports = [];
    } else {
      transports = [
        new winston.transports.Console({
          format: winston.format.combine(...formats),
          stderrLevels: ['error']
        })
      ];
    }

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

  error(message: string, params?: Record<string, any>, meta?: any): void {
    const translated = this.isI18nKey(message) ? translate(this.config.lang, message, params) : message;
    this.winstonLogger.error(translated, meta);
  }

  warn(message: string, params?: Record<string, any>, meta?: any): void {
    const translated = this.isI18nKey(message) ? translate(this.config.lang, message, params) : message;
    this.winstonLogger.warn(translated, meta);
  }

  info(message: string, params?: Record<string, any>, meta?: any): void {
    const translated = this.isI18nKey(message) ? translate(this.config.lang, message, params) : message;
    this.winstonLogger.info(translated, meta);
  }

  private isI18nKey(key: string): boolean {
    // Verifica si la clave existe en el diccionario de mensajes
    try {
      const messages = require(`./i18n/${this.config.lang}.json`);
      return Object.prototype.hasOwnProperty.call(messages, key);
    } catch {
      return false;
    }
  }

  debug(message: string, params?: Record<string, any>, meta?: any): void {
    const translated = this.isI18nKey(message) ? translate(this.config.lang, message, params) : message;
    this.winstonLogger.debug(translated, meta);
  }

  // Métodos específicos para códigos de error HTTP
  logHttpError(message: string, httpStatus: HttpStatusCode, meta?: any): void {
    const logMeta = { httpStatus, statusCode: httpStatus, ...meta };
    if (httpStatus >= 500) {
      this.error(message, undefined, logMeta);
    } else if (httpStatus >= 400) {
      this.warn(message, undefined, logMeta);
    } else {
      this.info(message, undefined, logMeta);
    }
  }

  // Método específico para errores de aplicación
  logApplicationError(message: string, errorCode: ApplicationErrorCode, context?: ErrorContext): void {
    const logMeta = {
      errorCode,
      ...context
    };
    // Determinar nivel basado en el tipo de error
    if (errorCode.startsWith('SYS_') || errorCode.startsWith('DB_') || errorCode.startsWith('EXT_')) {
      this.error(message, undefined, logMeta);
    } else if (errorCode.startsWith('AUTH_') || errorCode.startsWith('BIZ_')) {
      this.warn(message, undefined, logMeta);
    } else {
      this.info(message, undefined, logMeta);
    }
  }

  // Método para logging de requests con códigos de estado
  logRequest(message: string, method: string, url: string, statusCode: number, duration?: number, meta?: any): void {
    const logMeta = {
      method,
      url,
      statusCode,
      duration,
      ...meta
    };
    if (statusCode >= 500) {
      this.error(message, undefined, logMeta);
    } else if (statusCode >= 400) {
      this.warn(message, undefined, logMeta);
    } else {
      this.info(message, undefined, logMeta);
    }
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