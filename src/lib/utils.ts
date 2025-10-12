import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v7 as uuidv7 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function assert(b: unknown, msg: string | (() => string) = 'Assertion failed'): asserts b {
	if (!b) {
		throw new Error(typeof msg === 'string' ? msg : msg());
	}
}

export function must<T>(v: T | undefined | null, msg?: string): T {
	if (v == null) {
		throw new Error(msg ?? `Unexpected ${v} value`);
	}
	return v;
}

export type UuidV7 = string & { __uuid_v7: true };

export const generateId = (): UuidV7 => {
	return uuidv7() as UuidV7;
};

export type NonEmptyArray<T> = [T, ...T[]];
export const isNonEmpty = <T>(arr: T[] | undefined | null): arr is NonEmptyArray<T> => {
	return Array.isArray(arr) && arr.length > 0;
};
