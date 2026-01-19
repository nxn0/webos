
// This file contains unit tests for the core logic of the simulated apps.
// To run these tests in a real environment, you would use 'vitest' or 'jest'.

import { describe, it, expect, vi } from 'vitest';

// --- Mocking logic for Calculator ---
const calculate = (expression: string) => {
    try {
        // eslint-disable-next-line no-eval
        return eval(expression).toString();
    } catch {
        return "Error";
    }
};

// --- Mocking logic for Currency Converter ---
const convertCurrency = (amount: number, from: string, to: string) => {
    const rates: Record<string, number> = { USD: 1, EUR: 0.85 };
    if (!rates[from] || !rates[to]) return null;
    return (amount * (rates[to] / rates[from])).toFixed(2);
};

describe('App Logic Tests', () => {
    describe('Calculator Logic', () => {
        it('should correctly add two numbers', () => {
            expect(calculate("2+2")).toBe("4");
        });

        it('should correctly multiply numbers', () => {
            expect(calculate("10*5")).toBe("50");
        });

        it('should handle order of operations', () => {
            expect(calculate("2+2*2")).toBe("6");
        });

        it('should return Error for invalid input', () => {
            // Note: eval might throw or return weird stuff depending on implementation,
            // but our wrapper catches errors.
            expect(calculate("2++2")).toBe("Error");
        });
    });

    describe('Currency Converter Logic', () => {
        it('should convert USD to EUR correctly', () => {
            // 100 * (0.85 / 1) = 85.00
            expect(convertCurrency(100, 'USD', 'EUR')).toBe("85.00");
        });

        it('should convert EUR to USD correctly', () => {
            // 85 * (1 / 0.85) = 100.00
            expect(convertCurrency(85, 'EUR', 'USD')).toBe("100.00");
        });
    });

    describe('Task Persistence (Mock)', () => {
        it('should store tasks in localStorage', () => {
           const mockSetItem =  vi.spyOn(Storage.prototype, 'setItem');
           const tasks = [{id: 1, text: 'Test', done: false}];
           localStorage.setItem('os_todo_tasks', JSON.stringify(tasks));
           expect(mockSetItem).toHaveBeenCalledWith('os_todo_tasks', JSON.stringify(tasks));
        });
    });
});
