type LogMethod = (message: string, meta?: Record<string, unknown>) => void;

function formatMeta(meta?: Record<string, unknown>) {
  if (!meta || Object.keys(meta).length === 0) return undefined;
  return meta;
}

const logger: {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
} = {
  debug: (message, meta) => console.debug(message, formatMeta(meta)),
  info: (message, meta) => console.info(message, formatMeta(meta)),
  warn: (message, meta) => console.warn(message, formatMeta(meta)),
  error: (message, meta) => console.error(message, formatMeta(meta)),
};

export default logger;
