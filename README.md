# @smdv/logger

Librería de logging profesional para microservicios Node.js con soporte para múltiples niveles, formatos JSON, colores en desarrollo y middleware para Express.

## Características

- ✅ **Niveles configurables**: error, warn, info, debug
- ✅ **Control por variables de entorno**: LOG_LEVEL y SERVICE_NAME
- ✅ **Formato JSON estructurado** con timestamp, service, level, message y stack
- ✅ **Modo desarrollo**: logs colorizados para mejor legibilidad
- ✅ **Modo producción**: JSON plano optimizado
- ✅ **Middleware Express**: logging automático de requests
- ✅ **Extensible**: preparado para transports futuros (CloudWatch, ELK, Loki, Datadog)
- ✅ **TypeScript**: completamente tipado

## Requisitos

- Node.js >= 16.0.0
- Variables de entorno:
  - `LOG_LEVEL` (opcional): error, warn, info, debug. Default: info
  - `SERVICE_NAME` (opcional): nombre del microservicio. Default: unknown-service
  - `NODE_ENV` (opcional): development o production. Default: development

## Instalación

```bash
npm install @smdv/logger
```

## Configuración

### Variables de entorno

```bash
# .env
LOG_LEVEL=info
SERVICE_NAME=mi-microservicio
NODE_ENV=production
```

### Jerarquía de niveles

Si `LOG_LEVEL=warn`, solo se mostrarán logs de nivel `warn` y `error`.

- `error` (nivel más alto)
- `warn`
- `info`
- `debug` (nivel más bajo)

## Uso básico

```javascript
const { logger } = require('@smdv/logger');

// Logs básicos
logger.info('Servicio iniciado correctamente');
logger.warn('Advertencia de memoria');
logger.error('Error en base de datos', new Error('DB Down'));
logger.debug('Payload recibido', { payload: { id: 123 } });

// Con metadata adicional
logger.info('Usuario autenticado', { 
  userId: 12345, 
  email: 'user@example.com',
  timestamp: new Date().toISOString()
});

// Error con stack trace
try {
  throw new Error('Algo salió mal');
} catch (error) {
  logger.error('Error capturado', error, { 
    context: 'procesamiento-datos',
    userId: 123 
  });
}
```

## Logging con códigos de error HTTP y de aplicación

### Códigos de estado HTTP

```javascript
const { logger, HttpStatusCode } = require('@smdv/logger');

// Logging con códigos HTTP específicos
logger.logHttpError('Usuario no encontrado', HttpStatusCode.NOT_FOUND, {
  userId: 123,
  endpoint: '/api/users/123'
});

logger.logHttpError('Error interno del servidor', HttpStatusCode.INTERNAL_SERVER_ERROR, {
  component: 'database',
  operation: 'getUserById'
});

// Logging de requests con códigos de estado
logger.logRequest('API Request', 'GET', '/api/users', 200, 150, {
  userId: 123,
  userAgent: 'Mozilla/5.0...'
});
```

### Códigos de error de aplicación

```javascript
const { logger, ApplicationErrorCode } = require('@smdv/logger');

// Errores de autenticación
logger.logApplicationError('Token expirado', ApplicationErrorCode.AUTH_TOKEN_EXPIRED, {
  userId: 123,
  requestId: 'req-456',
  component: 'auth-service'
});

// Errores de base de datos
logger.logApplicationError('Error de conexión a BD', ApplicationErrorCode.DB_CONNECTION_ERROR, {
  component: 'user-service',
  operation: 'createUser',
  correlationId: 'corr-789'
});

// Errores de servicios externos
logger.logApplicationError('Servicio de pagos no disponible', ApplicationErrorCode.EXT_SERVICE_UNAVAILABLE, {
  service: 'payment-gateway',
  endpoint: 'https://api.payments.com/charge',
  timeout: 5000
});

// Errores de negocio
logger.logApplicationError('Saldo insuficiente', ApplicationErrorCode.BIZ_INSUFFICIENT_BALANCE, {
  userId: 123,
  requestedAmount: 1000,
  availableBalance: 500,
  operation: 'transfer'
});
```

### Códigos disponibles

#### HTTP Status Codes
- **2xx**: `OK`, `CREATED`, `ACCEPTED`, `NO_CONTENT`
- **3xx**: `MOVED_PERMANENTLY`, `FOUND`, `NOT_MODIFIED`
- **4xx**: `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `CONFLICT`, `UNPROCESSABLE_ENTITY`, `TOO_MANY_REQUESTS`
- **5xx**: `INTERNAL_SERVER_ERROR`, `NOT_IMPLEMENTED`, `BAD_GATEWAY`, `SERVICE_UNAVAILABLE`, `GATEWAY_TIMEOUT`

#### Application Error Codes
- **AUTH_xxx**: Errores de autenticación y autorización
- **DB_xxx**: Errores de base de datos
- **EXT_xxx**: Errores de servicios externos
- **BIZ_xxx**: Errores de lógica de negocio
- **SYS_xxx**: Errores de sistema
- **VAL_xxx**: Errores de validación
- **GEN_xxx**: Errores genéricos

## Middleware para Express

### Uso básico

```javascript
const express = require('express');
const { logger, requestLogger } = require('@smdv/logger');

const app = express();

// Middleware básico - loggea todos los requests
app.use(requestLogger);

app.get('/health', (req, res) => {
  logger.info('Health check solicitado');
  res.json({ status: 'OK' });
});

app.listen(3000, () => {
  logger.info('Servidor iniciado', { port: 3000 });
});
```

### Middleware avanzado con opciones

```javascript
const { createRequestLogger } = require('@smdv/logger');

// Middleware con configuración personalizada
app.use(createRequestLogger({
  logBody: true,           // Incluir body del request
  logHeaders: false,       // No incluir headers
  skipPaths: ['/health'],  // Saltar estos paths
  skipSuccessful: false    // No saltar requests exitosos
}));
```

## Ejemplos de salida

### Modo desarrollo (NODE_ENV=development)

```bash
2024-01-15 10:30:45 [mi-microservicio] info: Servicio iniciado correctamente
2024-01-15 10:30:46 [mi-microservicio] info: Incoming request
{
  "method": "GET",
  "url": "/api/users",
  "userAgent": "Mozilla/5.0...",
  "ip": "127.0.0.1"
}
2024-01-15 10:30:47 [mi-microservicio] warn: Advertencia de memoria
2024-01-15 10:30:48 [mi-microservicio] error: Error en base de datos
Error: DB Down
    at Object.<anonymous> (/app/index.js:10:23)
    at Module._compile (internal/modules/cjs/loader.js:1063:30)
```

### Modo producción (NODE_ENV=production)

```json
{"timestamp":"2024-01-15 10:30:45","service":"mi-microservicio","level":"info","message":"Servicio iniciado correctamente"}
{"timestamp":"2024-01-15 10:30:46","service":"mi-microservicio","level":"info","message":"Incoming request","method":"GET","url":"/api/users","userAgent":"Mozilla/5.0...","ip":"127.0.0.1"}
{"timestamp":"2024-01-15 10:30:47","service":"mi-microservicio","level":"warn","message":"Advertencia de memoria"}
{"timestamp":"2024-01-15 10:30:48","service":"mi-microservicio","level":"error","message":"Error en base de datos","stack":"Error: DB Down\n    at Object.<anonymous> (/app/index.js:10:23)"}
{"timestamp":"2024-01-15 10:30:49","service":"mi-microservicio","level":"warn","message":"Usuario no encontrado","httpStatus":404,"statusCode":404,"userId":123,"endpoint":"/api/users/123"}
{"timestamp":"2024-01-15 10:30:50","service":"mi-microservicio","level":"error","message":"Error de conexión a BD","errorCode":"DB_001","component":"user-service","operation":"createUser"}
```

## Configuración avanzada

### Logger personalizado

```javascript
const { createCustomLogger } = require('@smdv/logger');

const customLogger = createCustomLogger({
  level: 'debug',
  service: 'mi-servicio-especial',
  isDevelopment: false
});

customLogger.debug('Log con configuración personalizada');
```

### Agregar transports personalizados

```javascript
const winston = require('winston');
const { logger } = require('@smdv/logger');

// Agregar transport de archivo
const fileTransport = new winston.transports.File({
  filename: 'app.log',
  format: winston.format.json()
});

logger.addTransport(fileTransport);
```

## Extensibilidad futura

La librería está preparada para agregar transports adicionales:

```javascript
// Próximamente disponibles
const { TransportFactory } = require('@smdv/logger');

// CloudWatch (futuro)
// const cloudWatchTransport = TransportFactory.createCloudWatchTransport({
//   logGroupName: 'mi-app',
//   logStreamName: 'mi-stream'
// });

// ELK Stack (futuro)
// const elkTransport = TransportFactory.createELKTransport({
//   host: 'elasticsearch.example.com',
//   port: 9200
// });
```

## Scripts de desarrollo

```bash
# Compilar TypeScript
npm run build

# Linting
npm run lint

# Tests
npm run test

# Empaquetar
npm run pack
```

## Estructura del proyecto

```
@smdv/logger/
├── src/
│   ├── index.ts          # Exportaciones principales
│   ├── logger.ts         # Clase Logger principal
│   ├── middleware.ts     # Middleware Express
│   ├── types.ts          # Definiciones TypeScript
│   ├── factory.ts        # Factory para configuraciones
│   └── __tests__/        # Tests unitarios
├── dist/                 # Archivos compilados
├── package.json
├── tsconfig.json
├── README.md
└── .eslintrc.js
```

## Licencia

MIT

## Soporte

Para reportar bugs o solicitar features, crear un issue en el repositorio del proyecto.