// Centralización de constantes y enums para toda la librería

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export enum Environment {
  LOCAL = 'local',
  DEVELOP = 'develop',
  TESTING = 'testing',
  PRODUCTION = 'production'
}

export enum OutputFormat {
  JSON = 'json',
  XML = 'xml'
}

export enum SupportedLang {
  EN = 'en',
  ES = 'es'
}

export const ENV_KEYS = {
  LOG_LEVEL: 'LOG_LEVEL',
  SERVICE_NAME: 'SERVICE_NAME',
  NODE_ENV: 'NODE_ENV',
  LOG_LANG: 'LOG_LANG',
  LOG_FORMAT: 'LOG_FORMAT'
};

export const DEFAULTS = {
  LOG_LEVEL: LogLevel.INFO,
  SERVICE_NAME: 'unknown-service',
  NODE_ENV: Environment.DEVELOP,
  LOG_LANG: SupportedLang.EN,
  LOG_FORMAT: OutputFormat.JSON
};

// Reexportar los códigos de error y status si se usan en toda la librería
export { HttpStatusCode, ApplicationErrorCode } from './types';
