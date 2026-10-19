const SENSITIVE_KEY =
  /(^|[._-])(authorization|password|passcode|secret|token|api[_-]?key|email|phone|name|otp|code|card|cvv|billing|contact|address)([._-]|$)/i;
const LOG_LIMIT = 4096;

export function isSensitiveLogKey(key: string): boolean {
  return SENSITIVE_KEY.test(key.replace(/([a-z])([A-Z])/g, '$1_$2'));
}

export function redactLogText(message: string): string {
  return message
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/([?&]token=)[^&#\s\"']+/gi, '$1[REDACTED]')
    .replace(
      /\b(api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)["']?\s*[:=]\s*["']?[^\s,"'}]+/gi,
      '$1=[REDACTED]',
    );
}

export function sanitizeLogText(message: string): string {
  return redactLogText(message).slice(0, LOG_LIMIT);
}

function redactJson(value: unknown): unknown {
  if (typeof value === 'string') return redactLogText(value);
  if (Array.isArray(value)) return value.map(redactJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        isSensitiveLogKey(key) ? '[REDACTED]' : redactJson(item),
      ]),
    );
  }
  return value;
}

/** 실제 전송 문자열에서만 생성한다. 실패 시 원문으로 대체하지 않는다. */
export function sanitizeRequest(body: string | undefined): {
  request?: string;
  requestTruncated?: boolean;
} {
  if (body === undefined) return {};
  try {
    const request = JSON.stringify(redactJson(JSON.parse(body)));
    return {
      request: request.slice(0, LOG_LIMIT),
      ...(request.length > LOG_LIMIT ? { requestTruncated: true } : {}),
    };
  } catch {
    return {};
  }
}
