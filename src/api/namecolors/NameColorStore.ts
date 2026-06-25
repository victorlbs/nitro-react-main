import { useEffect, useState } from 'react';

const colorsByUsername = new Map<string, string>();
const subscribers = new Set<() => void>();

const normalizeUsername = (username: string): string => String(username || '').trim().toLowerCase();

const normalizeHex = (color: string): string => {
    const value = String(color || '').trim();

    if(!value) return '';
    if(!/^#[0-9A-Fa-f]{6}$/.test(value)) return '';

    return value.toUpperCase();
};

const emit = (): void => {
    subscribers.forEach(callback => callback());
};

export const SetNameColor = (username: string, color: string): void => {
    const key = normalizeUsername(username);

    if(!key) return;

    const safeColor = normalizeHex(color);

    if(!safeColor) colorsByUsername.delete(key);
    else colorsByUsername.set(key, safeColor);

    emit();
};

export const GetNameColor = (username: string): string => {
    const key = normalizeUsername(username);

    if(!key) return '';

    return colorsByUsername.get(key) || '';
};

export const SubscribeNameColors = (callback: () => void): (() => void) => {
    subscribers.add(callback);

    return () => subscribers.delete(callback);
};

export const useNameColor = (username: string): string => {
    const [ color, setColor ] = useState(() => GetNameColor(username));

    useEffect(() => {
        const update = () => setColor(GetNameColor(username));

        update();

        return SubscribeNameColors(update);
    }, [ username ]);

    return color;
};
