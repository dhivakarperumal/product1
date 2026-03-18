const { createLogger, format, transports } = require('winston');

const { combine, timestamp, errors, splat, printf, json, colorize } = format;
const isProd = process.env.NODE_ENV === 'production';

const devFormat = printf(({ timestamp, level, message, stack }) => {
  const msg = stack || message;
  return `${timestamp} [${level}]: ${msg}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProd
    ? combine(timestamp(), errors({ stack: true }), splat(), json())
    : combine(colorize(), timestamp(), errors({ stack: true }), splat(), devFormat),
  transports: [new transports.Console()],
});

module.exports = logger;
