import { Decimal } from '@prisma/client/runtime/library';

/**
 * Chuyển đổi các trường Decimal trong object thành number
 */
export function convertDecimalFields<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };

  for (const key in result) {
    const value = result[key];

    if (value && typeof value === 'object' && (value as any) instanceof Decimal) {
      result[key] = value.toNumber() as any;
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => convertDecimalFields(item)) as any;
    } else if (value && typeof value === 'object' && value.constructor === Object) {
      result[key] = convertDecimalFields(value);
    }
  }

  return result;
}

/**
 * Chuyển đổi mảng objects với Decimal fields
 */
export function convertDecimalArray<T extends Record<string, any>>(arr: T[]): T[] {
  return arr.map((item) => convertDecimalFields(item));
}

/**
 * Chuyển đổi Decimal thành number cho JSON serialization
 */
export function toJSON<T extends Record<string, any>>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => {
      if (value instanceof Decimal) {
        return value.toNumber();
      }
      return value;
    })
  );
}
