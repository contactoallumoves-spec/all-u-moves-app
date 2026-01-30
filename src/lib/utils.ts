import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function removeUndefined(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Handle Arrays
    if (Array.isArray(obj)) {
        return obj.map(removeUndefined);
    }

    // Handle Objects
    const result: any = {};
    for (const key of Object.keys(obj)) {
        const value = removeUndefined(obj[key]);
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}
