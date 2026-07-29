import { GroupItem } from '../../../../api';

export type InventoryTheme = 'classic' | 'light' | 'dark' | 'pixel';
export type InventorySmartFilter = 'all' | 'favorites' | 'recent' | 'new' | 'locked' | 'rare';

export interface InventoryCollection
{
    id: string;
    name: string;
    itemKeys: string[];
}

export interface InventoryProState
{
    favorites: string[];
    locked: string[];
    recent: string[];
    usage: Record<string, number>;
    tags: Record<string, string[]>;
    collections: InventoryCollection[];
    pinnedFilters: InventorySmartFilter[];
    theme: InventoryTheme;
    gridColumns: number;
    compact: boolean;
}

const STORAGE_KEY = 'nitro.inventory.pro.v1';

export const DEFAULT_INVENTORY_PRO_STATE: InventoryProState = {
    favorites: [],
    locked: [],
    recent: [],
    usage: {},
    tags: {},
    collections: [],
    pinnedFilters: [ 'favorites', 'recent', 'new' ],
    theme: 'classic',
    gridColumns: 5,
    compact: false
};

export const getInventoryItemKey = (groupItem: GroupItem): string =>
{
    const item = groupItem as any;
    const type = item.type ?? item.getLastItem?.()?.type ?? 'item';
    const name = item.name ?? 'unknown';
    const wall = item.isWallItem ? 'wall' : 'floor';

    return `${ wall }:${ type }:${ name }`;
};

export const readInventoryProState = (): InventoryProState =>
{
    try
    {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

        return {
            ...DEFAULT_INVENTORY_PRO_STATE,
            ...parsed,
            usage: { ...DEFAULT_INVENTORY_PRO_STATE.usage, ...(parsed.usage || {}) },
            tags: { ...DEFAULT_INVENTORY_PRO_STATE.tags, ...(parsed.tags || {}) }
        };
    }
    catch
    {
        return { ...DEFAULT_INVENTORY_PRO_STATE };
    }
};

export const saveInventoryProState = (state: InventoryProState): void =>
{
    try
    {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    catch
    {
        // O inventário continua funcionando mesmo se o navegador bloquear storage.
    }
};

export const downloadInventoryJson = (groupItems: GroupItem[], state: InventoryProState): void =>
{
    const payload = {
        exportedAt: new Date().toISOString(),
        totalGroups: groupItems.length,
        totalUnits: groupItems.reduce((total, item) => total + item.getUnlockedCount(), 0),
        items: groupItems.map(item => {
            const key = getInventoryItemKey(item);

            return {
                key,
                name: item.name,
                quantity: item.getUnlockedCount(),
                favorite: state.favorites.includes(key),
                locked: state.locked.includes(key),
                tags: state.tags[key] || [],
                usageCount: state.usage[key] || 0,
                unseen: item.hasUnseenItems,
                rarityLevel: item.stuffData?.rarityLevel ?? -1
            };
        }),
        collections: state.collections
    };

    const blob = new Blob([ JSON.stringify(payload, null, 2) ], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `inventario-${ Date.now() }.json`;
    anchor.click();
    URL.revokeObjectURL(url);
};
