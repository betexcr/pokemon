/**
 * Structured JSON logger for server routes (Vercel stdout → Log Drain / platform logs).
 */
export type LogFields = Record<string, unknown>;

function emit(level: string, msg: string, fields?: LogFields): void {
  const line = JSON.stringify({
    level,
    msg,
    ts: new Date().toISOString(),
    ...fields,
  });
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info(msg: string, fields?: LogFields) {
    emit('info', msg, fields);
  },
  warn(msg: string, fields?: LogFields) {
    emit('warn', msg, fields);
  },
  error(msg: string, fields?: LogFields) {
    const err = fields?.err;
    const safe =
      err instanceof Error
        ? { errName: err.name, errMessage: err.message }
        : err != null
          ? { err: String(err) }
          : {};
    const { err: _drop, ...rest } = fields ?? {};
    emit('error', msg, { ...rest, ...safe });
  },
};
