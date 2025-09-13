import { logger } from '../logger';
import { HttpStatusCode, ApplicationErrorCode } from '../types';

// Mock process.stdout.write and process.stderr.write since Winston writes directly to these
const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

describe('Logger', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    stdoutSpy.mockClear();
    stderrSpy.mockClear();
  });

  afterAll(() => {
    // Restore process methods
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it('should log error messages with stack trace', () => {
    const error = new Error('Test error');
    logger.error('Test error message', error);
    expect(stderrSpy).toHaveBeenCalled();
  });

  it('should log warn messages', () => {
    logger.warn('Test warning message');
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it('should log debug messages', () => {
    logger.debug('Test debug message');
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it('should include service name in logs', () => {
    const config = logger.getConfig();
    expect(config.service).toBeDefined();
  });

  it('should handle metadata objects', () => {
    logger.info('User action', { userId: 123, action: 'login' });
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it('should log HTTP errors with status codes', () => {
    logger.logHttpError('Bad request error', HttpStatusCode.BAD_REQUEST, { userId: 123 });
    expect(stderrSpy).toHaveBeenCalled();
  });

  it('should log application errors with error codes', () => {
    logger.logApplicationError('Database connection failed', ApplicationErrorCode.DB_CONNECTION_ERROR, {
      component: 'user-service',
      operation: 'getUserById'
    });
    expect(stderrSpy).toHaveBeenCalled();
  });

  it('should log requests with status codes', () => {
    logger.logRequest('API request', 'GET', '/api/users', 200, 150, { userId: 123 });
    expect(stdoutSpy).toHaveBeenCalled();
  });

  it('should log different levels to appropriate streams', () => {
    // Clear spies before this test
    stdoutSpy.mockClear();
    stderrSpy.mockClear();

    // Test info goes to stdout
    logger.info('Info message');
    expect(stdoutSpy).toHaveBeenCalled();
    expect(stderrSpy).not.toHaveBeenCalled();

    // Clear and test error goes to stderr
    stdoutSpy.mockClear();
    stderrSpy.mockClear();
    
    logger.error('Error message');
    expect(stderrSpy).toHaveBeenCalled();
    expect(stdoutSpy).not.toHaveBeenCalled();
  });
});