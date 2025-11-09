import { describe, it, expect } from 'vitest';

// Mirror the parsing logic from the edge function
const bool = (v?: string) => (v ?? '').toLowerCase() === 'true';
const int  = (v?: string, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const clampBudget = (v?: string) =>
  Math.min(60000, Math.max(3000, int(v, 25000)));

describe('env parsing', () => {
  describe('bool parsing', () => {
    it('should parse true values', () => {
      expect(bool('true')).toBe(true);
      expect(bool('TRUE')).toBe(true);
      expect(bool('True')).toBe(true);
    });

    it('should parse false values', () => {
      expect(bool('false')).toBe(false);
      expect(bool('FALSE')).toBe(false);
      expect(bool('anything')).toBe(false);
      expect(bool('')).toBe(false);
    });

    it('should handle undefined', () => {
      expect(bool(undefined)).toBe(false);
    });
  });

  describe('int parsing & clamping', () => {
    it('should apply floor (3000ms)', () => {
      expect(clampBudget('1000')).toBe(3000);
      expect(clampBudget('2999')).toBe(3000);
      expect(clampBudget('0')).toBe(3000);
      expect(clampBudget('-1000')).toBe(3000);
    });

    it('should accept valid values in range', () => {
      expect(clampBudget('3000')).toBe(3000);
      expect(clampBudget('25000')).toBe(25000);
      expect(clampBudget('45000')).toBe(45000);
      expect(clampBudget('60000')).toBe(60000);
    });

    it('should apply ceiling (60000ms)', () => {
      expect(clampBudget('60001')).toBe(60000);
      expect(clampBudget('120000')).toBe(60000);
      expect(clampBudget('999999')).toBe(60000);
    });

    it('should use default for invalid values', () => {
      expect(clampBudget(undefined)).toBe(25000);
      expect(clampBudget('')).toBe(25000);
      expect(clampBudget('not-a-number')).toBe(25000);
      expect(clampBudget('NaN')).toBe(25000);
    });
  });

  describe('int parsing without clamp', () => {
    it('should parse valid integers', () => {
      expect(int('42')).toBe(42);
      expect(int('0')).toBe(0);
      expect(int('-10')).toBe(-10);
    });

    it('should use default for invalid values', () => {
      expect(int(undefined)).toBe(0);
      expect(int('', 100)).toBe(100);
      expect(int('abc', 50)).toBe(50);
    });

    it('should handle edge cases', () => {
      expect(int('Infinity')).toBe(0); // Not finite
      expect(int('-Infinity')).toBe(0); // Not finite
    });
  });
});
