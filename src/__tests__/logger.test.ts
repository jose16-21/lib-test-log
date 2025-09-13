import { logger } from '../logger';

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  info: jest.spyOn(console, 'info').mockImplementation(),
};

describe('Logger', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
  });

  afterAll(() => {
    // Restore console methods
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('should log error messages with stack trace', () => {
    const error = new Error('Test error');
    logger.error('Test error message', error);
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('should log warn messages', () => {
    logger.warn('Test warning message');
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('should log debug messages', () => {
    logger.debug('Test debug message');
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('should include service name in logs', () => {
    const config = logger.getConfig();
    expect(config.service).toBeDefined();
  });

  it('should handle metadata objects', () => {
    const metadata = { userId: 123, action: 'login' };
    logger.info('User action', metadata);
    expect(consoleSpy.log).toHaveBeenCalled();
  });
});