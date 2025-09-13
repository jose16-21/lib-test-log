# @tigo-sport/logger

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
npm install @tigo-sport/logger
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
const { logger } = require('@tigo-sport/logger');

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

## Middleware para Express

### Uso básico

```javascript
const express = require('express');
const { logger, requestLogger } = require('@tigo-sport/logger');

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
const { createRequestLogger } = require('@tigo-sport/logger');

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
```

## Configuración avanzada

### Logger personalizado

```javascript
const { createCustomLogger } = require('@tigo-sport/logger');

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
const { logger } = require('@tigo-sport/logger');

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
const { TransportFactory } = require('@tigo-sport/logger');

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
@tigo-sport/logger/
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