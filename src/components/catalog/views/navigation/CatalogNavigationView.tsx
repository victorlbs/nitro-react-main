import { FC, useCallback, useEffect, useState } from 'react';
import { FaClock, FaStar } from 'react-icons/fa';
import { CatalogPage, FurnitureOffer, GetSessionDataManager, ICatalogNode, ICatalogPage, IPurchasableOffer, PageLocalization } from '../../../../api';
import { AutoGrid, Column, Flex } from '../../../../common';
import { useCatalog } from '../../../../hooks';
import { CatalogSearchView } from '../page/common/CatalogSearchView';
import { CatalogNavigationItemView } from './CatalogNavigationItemView';
import { CatalogNavigationSetView } from './CatalogNavigationSetView';

export interface CatalogNavigationViewProps
{
    node: ICatalogNode;
}

const FAVORITES_KEY = 'nitro.catalog.favorites';
const RECENTS_KEY = 'nitro.catalog.recents';
const STORAGE_EVENT = 'nitro-catalog-local-lists-changed';
const SHOW_FAVORITES_KEY = 'nitro.catalog.show.favorites';
const SHOW_RECENTS_KEY = 'nitro.catalog.show.recents';
const PREFERENCES_EVENT = 'nitro-catalog-preferences-changed';

const readIds = (key: string): number[] =>
{
    try
    {
        const value = JSON.parse(localStorage.getItem(key) || '[]');

        return Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];
    }
    catch
    {
        return [];
    }
};


const readBooleanPreference = (key: string, defaultValue: boolean = true): boolean =>
{
    try
    {
        const value = localStorage.getItem(key);

        if(value === null) return defaultValue;

        return value === '1';
    }
    catch
    {
        return defaultValue;
    }
};

const writeBooleanPreference = (key: string, value: boolean) =>
{
    try
    {
        localStorage.setItem(key, value ? '1' : '0');
    }
    catch
    {
        // localStorage indisponível.
    }
};

const createOffersFromIds = (ids: number[]): IPurchasableOffer[] =>
{
    if(!ids.length) return [];

    const furnitureDatas = GetSessionDataManager().getAllFurnitureData({ loadFurnitureData: null });

    if(!furnitureDatas || !furnitureDatas.length) return [];

    const byOfferId = new Map<number, any>();

    for(const furniture of furnitureDatas)
    {
        const purchaseOfferId = Number(furniture.purchaseOfferId);
        const rentOfferId = Number(furniture.rentOfferId);

        if(purchaseOfferId > 0) byOfferId.set(purchaseOfferId, furniture);
        if(rentOfferId > 0 && !byOfferId.has(rentOfferId)) byOfferId.set(rentOfferId, furniture);
    }

    const offers: IPurchasableOffer[] = [];

    for(const id of ids)
    {
        const furniture = byOfferId.get(Number(id));

        if(!furniture) continue;

        offers.push(new FurnitureOffer(furniture));
    }

    return offers;
};

export const CatalogNavigationView: FC<CatalogNavigationViewProps> = props =>
{
    const { node = null } = props;
    const {
        searchResult = null,
        setSearchResult = null,
        setCurrentPage = null,
        setCurrentOffer = null
    } = useCatalog();

    const [ localPage, setLocalPage ] = useState<'favorites' | 'recents' | null>(null);
    const [ favoritesCount, setFavoritesCount ] = useState(0);
    const [ recentsCount, setRecentsCount ] = useState(0);
    const [ showFavorites, setShowFavorites ] = useState(() => readBooleanPreference(SHOW_FAVORITES_KEY, true));
    const [ showRecents, setShowRecents ] = useState(() => readBooleanPreference(SHOW_RECENTS_KEY, true));

    const refreshCounts = useCallback(() =>
    {
        setFavoritesCount(readIds(FAVORITES_KEY).length);
        setRecentsCount(readIds(RECENTS_KEY).length);
    }, []);

    useEffect(() =>
    {
        refreshCounts();

        const refresh = () => refreshCounts();

        window.addEventListener('storage', refresh);
        window.addEventListener(STORAGE_EVENT, refresh as EventListener);

        return () =>
        {
            window.removeEventListener('storage', refresh);
            window.removeEventListener(STORAGE_EVENT, refresh as EventListener);
        };
    }, [ refreshCounts ]);


    useEffect(() =>
    {
        const refreshPreferences = () =>
        {
            setShowFavorites(readBooleanPreference(SHOW_FAVORITES_KEY, true));
            setShowRecents(readBooleanPreference(SHOW_RECENTS_KEY, true));
        };

        window.addEventListener('storage', refreshPreferences);
        window.addEventListener(PREFERENCES_EVENT, refreshPreferences as EventListener);

        return () =>
        {
            window.removeEventListener('storage', refreshPreferences);
            window.removeEventListener(PREFERENCES_EVENT, refreshPreferences as EventListener);
        };
    }, []);

    const openLocalPage = (type: 'favorites' | 'recents') =>
    {
        const ids = readIds(type === 'favorites' ? FAVORITES_KEY : RECENTS_KEY);
        const offers = createOffersFromIds(ids);
        const title = type === 'favorites' ? 'Meus Favoritos' : 'Vistos Recentemente';
        const description = offers.length
            ? `${ offers.length } mobi${ offers.length === 1 ? '' : 's' } nesta lista.`
            : (type === 'favorites'
                ? 'Você ainda não adicionou nenhum mobi aos favoritos.'
                : 'Você ainda não visualizou nenhum mobi recentemente.');

        if(searchResult) setSearchResult(null);

        setCurrentOffer(null);
        setCurrentPage((new CatalogPage(
            type === 'favorites' ? -91001 : -91002,
            'default_3x3',
            new PageLocalization([ description ], []),
            offers,
            false,
            1
        ) as ICatalogPage));

        setLocalPage(type);
        refreshCounts();
    };

    const clearLocalState = () => setLocalPage(null);


    return (
        <>
            <CatalogSearchView />

            <Column className="nitro-catalog-local-navigation" gap={ 1 }>
               

                { showFavorites &&
                    <Flex
                        alignItems="center"
                        gap={ 1 }
                        className={ `nitro-catalog-local-navigation-item ${ localPage === 'favorites' ? 'active' : '' }` }
                        onClick={ () => openLocalPage('favorites') }
                    >
                        <FaStar className="fa-icon" />
                        <span className="nitro-catalog-local-navigation-label">Meus Favoritos</span>
                        <span className="nitro-catalog-local-navigation-count">{ favoritesCount }</span>
                    </Flex>
                }

                { showRecents &&
                    <Flex
                        alignItems="center"
                        gap={ 1 }
                        className={ `nitro-catalog-local-navigation-item ${ localPage === 'recents' ? 'active' : '' }` }
                        onClick={ () => openLocalPage('recents') }
                    >
                        <FaClock className="fa-icon" />
                        <span className="nitro-catalog-local-navigation-label">Vistos Recentemente</span>
                        <span className="nitro-catalog-local-navigation-count">{ recentsCount }</span>
                    </Flex>
                }
            </Column>

            <Column
                fullHeight
                className="nitro-catalog-navigation-grid-container rounded p-1"
                overflow="hidden"
                onClick={ clearLocalState }
            >
                <AutoGrid id="nitro-catalog-main-navigation" gap={ 1 } columnCount={ 1 }>
                    { searchResult && (searchResult.filteredNodes.length > 0) && searchResult.filteredNodes.map((n, index) =>
                    {
                        return <CatalogNavigationItemView key={ index } node={ n } />;
                    }) }

                    { !searchResult &&
                        <CatalogNavigationSetView node={ node } /> }
                </AutoGrid>
            </Column>
        </>
    );
};
