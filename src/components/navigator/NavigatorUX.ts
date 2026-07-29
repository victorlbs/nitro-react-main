import { RoomDataParser } from '@nitrots/nitro-renderer';

export interface NavigatorStoredRoom
{
    roomId: number;
    roomName: string;
    ownerId: number;
    ownerName: string;
    description: string;
    userCount: number;
    maxUserCount: number;
    doorMode: number;
    habboGroupId: number;
    groupBadgeCode: string;
    officialRoomPicRef: string;
    categoryId?: number;
    tags?: string[];
    friendCount?: number;
    visitedAt?: number;
}

export interface NavigatorUXSettings
{
    viewMode: 'compact' | 'normal' | 'large';
    showThumbnails: boolean;
    showEmptyRooms: boolean;
    showRecommendations: boolean;
    showQuickAccess: boolean;
    minUsers: number;
    doorFilter: 'all' | 'open' | 'locked';
    sortMode: 'default' | 'users-desc' | 'users-asc' | 'name-asc' | 'name-desc';
}

export const NAV_FAVORITES_KEY = 'nitro.navigator.favorites';
export const NAV_RECENTS_KEY = 'nitro.navigator.recents';
export const NAV_LAST_ROOM_KEY = 'nitro.navigator.last-room';
export const NAV_SETTINGS_KEY = 'nitro.navigator.settings';
export const NAV_CHANGED_EVENT = 'nitro-navigator-ux-changed';
export const MAX_RECENTS = 30;

export const defaultNavigatorSettings: NavigatorUXSettings = {
    viewMode: 'normal',
    showThumbnails: true,
    showEmptyRooms: true,
    showRecommendations: true,
    showQuickAccess: true,
    minUsers: 0,
    doorFilter: 'all',
    sortMode: 'default'
};

const safeParse = <T>(value: string, fallback: T): T =>
{
    try
    {
        return JSON.parse(value) as T;
    }
    catch
    {
        return fallback;
    }
};

export const readStoredRooms = (key: string): NavigatorStoredRoom[] =>
{
    try
    {
        const value = safeParse<any[]>(localStorage.getItem(key) || '[]', []);
        return Array.isArray(value) ? value.filter(room => Number(room?.roomId) > 0) : [];
    }
    catch
    {
        return [];
    }
};

export const writeStoredRooms = (key: string, rooms: NavigatorStoredRoom[]) =>
{
    try
    {
        localStorage.setItem(key, JSON.stringify(rooms));
        window.dispatchEvent(new Event(NAV_CHANGED_EVENT));
    }
    catch
    {
        // localStorage indisponível.
    }
};

export const readNavigatorSettings = (): NavigatorUXSettings =>
{
    try
    {
        const saved = safeParse<Partial<NavigatorUXSettings>>(localStorage.getItem(NAV_SETTINGS_KEY) || '{}', {});
        return { ...defaultNavigatorSettings, ...saved };
    }
    catch
    {
        return { ...defaultNavigatorSettings };
    }
};

export const writeNavigatorSettings = (settings: NavigatorUXSettings) =>
{
    try
    {
        localStorage.setItem(NAV_SETTINGS_KEY, JSON.stringify(settings));
        window.dispatchEvent(new Event(NAV_CHANGED_EVENT));
    }
    catch
    {
        // localStorage indisponível.
    }
};

export const normalizeRoom = (room: RoomDataParser | any): NavigatorStoredRoom => ({
    roomId: Number(room?.roomId || 0),
    roomName: String(room?.roomName || ''),
    ownerId: Number(room?.ownerId || 0),
    ownerName: String(room?.ownerName || ''),
    description: String(room?.description || ''),
    userCount: Number(room?.userCount || 0),
    maxUserCount: Number(room?.maxUserCount || 0),
    doorMode: Number(room?.doorMode || 0),
    habboGroupId: Number(room?.habboGroupId || 0),
    groupBadgeCode: String(room?.groupBadgeCode || ''),
    officialRoomPicRef: String(room?.officialRoomPicRef || ''),
    categoryId: Number(room?.categoryId || 0),
    tags: Array.isArray(room?.tags) ? room.tags.map(String) : [],
    friendCount: Number(room?.friendCount ?? room?.friendsCount ?? room?.friendsInside ?? 0),
    visitedAt: Date.now()
});

export const isFavoriteRoom = (roomId: number) =>
    readStoredRooms(NAV_FAVORITES_KEY).some(room => Number(room.roomId) === Number(roomId));

export const toggleFavoriteRoom = (room: RoomDataParser | any) =>
{
    const normalized = normalizeRoom(room);
    const current = readStoredRooms(NAV_FAVORITES_KEY);
    const exists = current.some(item => item.roomId === normalized.roomId);

    writeStoredRooms(
        NAV_FAVORITES_KEY,
        exists
            ? current.filter(item => item.roomId !== normalized.roomId)
            : [ normalized, ...current.filter(item => item.roomId !== normalized.roomId) ]
    );
};

export const registerRoomVisit = (room: RoomDataParser | any) =>
{
    const normalized = normalizeRoom(room);
    const current = readStoredRooms(NAV_RECENTS_KEY).filter(item => item.roomId !== normalized.roomId);
    const next = [ normalized, ...current ].slice(0, MAX_RECENTS);

    writeStoredRooms(NAV_RECENTS_KEY, next);

    try
    {
        localStorage.setItem(NAV_LAST_ROOM_KEY, JSON.stringify(normalized));
    }
    catch
    {
        // localStorage indisponível.
    }
};

export const readLastRoom = (): NavigatorStoredRoom | null =>
{
    try
    {
        const room = safeParse<NavigatorStoredRoom | null>(localStorage.getItem(NAV_LAST_ROOM_KEY) || 'null', null);
        return room && Number(room.roomId) > 0 ? room : null;
    }
    catch
    {
        return null;
    }
};
