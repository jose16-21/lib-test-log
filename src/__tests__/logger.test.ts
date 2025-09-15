// Helper para limpiar códigos de color ANSI
function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

import { Logger } from '../logger';
import { LogLevel } from '../types';
import { HttpStatusCode, ApplicationErrorCode } from '../types';

import Transport from 'winston-transport';

// Mock transport for winston compatible with winston-transport
class TestTransport extends Transport {
  public logs: any[] = [];
  log(info: any, callback: () => void) {
    console.log('TestTransport log called:', info);
    this.logs.push(info);
    callback();
  }
}

const testTransport = new TestTransport();
const logger = new Logger({ level: LogLevel.DEBUG }, [testTransport]);


describe('Logger', () => {
  beforeEach(() => {
    testTransport.logs = [];
  });


  it('should log info messages', async () => {
    logger.info('Test info message');
    await new Promise(resolve => setImmediate(resolve));
  expect(testTransport.logs.some(log => stripAnsi(log.level) === 'info' && stripAnsi(log.message) === 'Test info message')).toBe(true);
  });


  it('should log error messages with stack trace', async () => {
    const error = new Error('Test error');
    logger.error('Test error message', error);
    await new Promise(resolve => setImmediate(resolve));
  expect(testTransport.logs.some(log => stripAnsi(log.level) === 'error' && stripAnsi(log.message) === 'Test error message')).toBe(true);
  });


  it('should log warn messages', async () => {
    logger.warn('Test warning message');
    await new Promise(resolve => setImmediate(resolve));
  expect(testTransport.logs.some(log => stripAnsi(log.level) === 'warn' && stripAnsi(log.message) === 'Test warning message')).toBe(true);
  });


  it('should log debug messages', async () => {
    logger.debug('Test debug message');
    await new Promise(resolve => setImmediate(resolve));
  expect(testTransport.logs.some(log => stripAnsi(log.level) === 'debug' && stripAnsi(log.message) === 'Test debug message')).toBe(true);
  });

  it('should include service name in logs', () => {
    const config = logger.getConfig();
    expect(config.service).toBeDefined();
  });

  it('should log with service name "app1"', async () => {
    const testTransport1 = new TestTransport();
    const logger1 = new Logger({ level: LogLevel.DEBUG, service: 'app1' }, [testTransport1]);
    logger1.info('App1 info');
    await new Promise(resolve => setImmediate(resolve));
    expect(testTransport1.logs.some(log => log.service === 'app1' && stripAnsi(log.message) === 'App1 info')).toBe(true);
  });

  it('should log with service name "app2"', async () => {
    const testTransport2 = new TestTransport();
    const logger2 = new Logger({ level: LogLevel.DEBUG, service: 'app2' }, [testTransport2]);
    logger2.error('App2 error');
    await new Promise(resolve => setImmediate(resolve));
    expect(testTransport2.logs.some(log => log.service === 'app2' && stripAnsi(log.message) === 'App2 error')).toBe(true);
  });


  it('should handle metadata objects', async () => {
    logger.info('User action', { userId: 123, action: 'login' });
    await new Promise(resolve => setImmediate(resolve));
  expect(testTransport.logs.some(log => stripAnsi(log.level) === 'info' && stripAnsi(log.message) === 'User action' && log.userId === 123 && log.action === 'login')).toBe(true);
  });


  it('should log HTTP errors with status codes', async () => {
    logger.logHttpError('Bad request error', HttpStatusCode.BAD_REQUEST, { userId: 123 });
    await new Promise(resolve => setImmediate(resolve));
  expect(testTransport.logs.some(log => stripAnsi(log.level) === 'warn' && stripAnsi(log.message) === 'Bad request error' && log.httpStatus === HttpStatusCode.BAD_REQUEST)).toBe(true);
  });


  it('should log application errors with error codes', async () => {
    logger.logApplicationError('Database connection failed', ApplicationErrorCode.DB_CONNECTION_ERROR, {
      component: 'user-service',
      operation: 'getUserById'
    });
    await new Promise(resolve => setImmediate(resolve));
  expect(testTransport.logs.some(log => stripAnsi(log.level) === 'error' && stripAnsi(log.message) === 'Database connection failed' && log.errorCode === ApplicationErrorCode.DB_CONNECTION_ERROR)).toBe(true);
  });


  it('should log requests with status codes', async () => {
    logger.logRequest('API request', 'GET', '/api/users', 200, 150, { userId: 123 });
    await new Promise(resolve => setImmediate(resolve));
  expect(testTransport.logs.some(log => stripAnsi(log.level) === 'info' && stripAnsi(log.message) === 'API request' && log.method === 'GET' && log.url === '/api/users')).toBe(true);
  });


  it('should log different levels to appropriate streams', async () => {
    logger.info('Info message');
    await new Promise(resolve => setImmediate(resolve));
  expect(testTransport.logs.some(log => stripAnsi(log.level) === 'info' && stripAnsi(log.message) === 'Info message')).toBe(true);
  logger.error('Error message');
  await new Promise(resolve => setImmediate(resolve));
  expect(testTransport.logs.some(log => stripAnsi(log.level) === 'error' && stripAnsi(log.message) === 'Error message')).toBe(true);
  });
});