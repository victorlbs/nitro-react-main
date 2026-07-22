import { ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaCog } from 'react-icons/fa';
import
    {
        AddEventLinkTracker,
        GetConfiguration,
        LocalizeText,
        RemoveLinkEventTracker
    } from '../../api';
import
    {
        Column,
        Flex,
        Grid,
        NitroCardContentView,
        NitroCardHeaderView,
        NitroCardTabsItemView,
        NitroCardTabsView,
        NitroCardView
    } from '../../common';
import { useCatalog } from '../../hooks';
import { CatalogIconView } from './views/catalog-icon/CatalogIconView';
import { CatalogGiftView } from './views/gift/CatalogGiftView';
import { CatalogNavigationView } from './views/navigation/CatalogNavigationView';
import { GetCatalogLayout } from './views/page/layout/GetCatalogLayout';
import { MarketplacePostOfferView } from './views/page/layout/marketplace/MarketplacePostOfferView';

const CATALOG_EXPANDED_STORAGE_KEY = 'nitro.catalog.expanded';
const CATALOG_NAVIGATION_STORAGE_KEY = 'nitro.catalog.navigation.hidden';
const SHOW_FAVORITES_KEY = 'nitro.catalog.show.favorites';
const SHOW_RECENTS_KEY = 'nitro.catalog.show.recents';
const PREFERENCES_EVENT = 'nitro-catalog-preferences-changed';

export const CatalogView: FC<{}> = () =>
{
    const {
        isVisible = false,
        setIsVisible = null,
        rootNode = null,
        currentPage = null,
        navigationHidden = false,
        setNavigationHidden = null,
        activeNodes = [],
        searchResult = null,
        setSearchResult = null,
        openPageByName = null,
        openPageByOfferId = null,
        activateNode = null
    } = useCatalog();

    /*
     * MODO EXPANDIDO
     *
     * O catálogo abre no tamanho normal, mas o usuário pode ampliar
     * a janela para visualizar mais itens ao mesmo tempo.
     *
     * A preferência é salva no localStorage.
     */
    const [ isExpanded, setIsExpanded ] = useState<boolean>(() =>
    {
        try
        {
            return localStorage.getItem(CATALOG_EXPANDED_STORAGE_KEY) === '1';
        }
        catch
        {
            return false;
        }
    });


    const readPreference = (key: string, defaultValue: boolean = true) =>
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

    const [ storeSettingsVisible, setStoreSettingsVisible ] = useState(false);
    const [ showFavorites, setShowFavorites ] = useState(() => readPreference(SHOW_FAVORITES_KEY, true));
    const [ showRecents, setShowRecents ] = useState(() => readPreference(SHOW_RECENTS_KEY, true));

    const updateStorePreference = (key: string, value: boolean) =>
    {
        try
        {
            localStorage.setItem(key, value ? '1' : '0');
        }
        catch
        {
            // localStorage indisponível.
        }

        window.dispatchEvent(new Event(PREFERENCES_EVENT));
    };

    const toggleFavoritesPreference = () =>
    {
        setShowFavorites(previous =>
        {
            const next = !previous;
            updateStorePreference(SHOW_FAVORITES_KEY, next);
            return next;
        });
    };

    const toggleRecentsPreference = () =>
    {
        setShowRecents(previous =>
        {
            const next = !previous;
            updateStorePreference(SHOW_RECENTS_KEY, next);
            return next;
        });
    };

    /*
     * Restaura a preferência de exibição da navegação lateral.
     */
    useEffect(() =>
    {
        try
        {
            const storedNavigationState = localStorage.getItem(CATALOG_NAVIGATION_STORAGE_KEY);

            if(storedNavigationState === null) return;

            setNavigationHidden(storedNavigationState === '1');
        }
        catch
        {
            // localStorage indisponível: mantém o comportamento padrão.
        }
    }, [ setNavigationHidden ]);

    /*
     * Link tracker padrão do catálogo.
     */
    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;

                    case 'hide':
                        setIsVisible(false);
                        return;

                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;

                    case 'open':
                        if(parts.length > 2)
                        {
                            if(parts.length === 4)
                            {
                                switch(parts[2])
                                {
                                    case 'offerId':
                                        openPageByOfferId(parseInt(parts[3]));
                                        return;
                                }
                            }
                            else
                            {
                                openPageByName(parts[2]);
                            }
                        }
                        else
                        {
                            setIsVisible(true);
                        }

                        return;
                }
            },
            eventUrlPrefix: 'catalog/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ setIsVisible, openPageByOfferId, openPageByName ]);

    const toggleExpanded = () =>
    {
        setIsExpanded(previous =>
        {
            const next = !previous;

            try
            {
                localStorage.setItem(
                    CATALOG_EXPANDED_STORAGE_KEY,
                    next ? '1' : '0'
                );
            }
            catch
            {
                // Ignora quando localStorage não estiver disponível.
            }

            return next;
        });
    };

    const toggleNavigation = () =>
    {
        const nextValue = !navigationHidden;

        setNavigationHidden(nextValue);

        try
        {
            localStorage.setItem(
                CATALOG_NAVIGATION_STORAGE_KEY,
                nextValue ? '1' : '0'
            );
        }
        catch
        {
            // Ignora quando localStorage não estiver disponível.
        }
    };

    const clearSearch = () =>
    {
        if(searchResult) setSearchResult(null);
    };

    return (
        <>
            { isVisible &&
                <NitroCardView
                    uniqueKey="catalog"
                    className={ `nitro-catalog ${ isExpanded ? 'nitro-catalog-expanded' : '' }` }
                    style={
                        GetConfiguration('catalog.headers')
                            ? { width: isExpanded ? 1050 : 710 }
                            : undefined
                    }
                >
                    <NitroCardHeaderView
                        headerText={ LocalizeText('catalog.title') }
                        onCloseClick={ () => setIsVisible(false) }
                    />

                    {/* ABAS PRINCIPAIS */}
                    <NitroCardTabsView>
                        { rootNode &&
                            (rootNode.children.length > 0) &&
                            rootNode.children.map(child =>
                            {
                                if(!child.isVisible) return null;

                                return (
                                    <NitroCardTabsItemView
                                        key={ child.pageId }
                                        isActive={ child.isActive }
                                        onClick={ () =>
                                        {
                                            clearSearch();
                                            activateNode(child);
                                        } }
                                    >
                                        <Flex
                                            gap={ GetConfiguration('catalog.tab.icons') ? 1 : 0 }
                                            alignItems="center"
                                        >
                                            { GetConfiguration('catalog.tab.icons') &&
                                                <CatalogIconView icon={ child.iconId } /> }

                                            { child.localization }
                                        </Flex>
                                    </NitroCardTabsItemView>
                                );
                            }) }
                    </NitroCardTabsView>

                    {/* BARRA DE FERRAMENTAS */}
                    <Flex
                        alignItems="center"
                        justifyContent="between"
                        className="nitro-catalog-toolbar"
                    >
                        <Flex alignItems="center" gap={ 1 }>
                            <button
                                type="button"
                                className="nitro-catalog-toolbar-button"
                                onClick={ toggleNavigation }
                                title={
                                    navigationHidden
                                        ? 'Mostrar categorias'
                                        : 'Ocultar categorias'
                                }
                            >
                                <span className="nitro-catalog-toolbar-icon">
                                    { navigationHidden ? '☰' : '◀' }
                                </span>

                                <span className="nitro-catalog-toolbar-label">
                                    { navigationHidden
                                        ? 'Categorias'
                                        : 'Ocultar categorias' }
                                </span>
                            </button>

                            { searchResult &&
                                <button
                                    type="button"
                                    className="nitro-catalog-toolbar-button"
                                    onClick={ clearSearch }
                                    title="Limpar pesquisa"
                                >
                                    <span>✕</span>
                                    <span className="nitro-catalog-toolbar-label">
                                        Limpar pesquisa
                                    </span>
                                </button>
                            }
                        </Flex>

                        <Flex alignItems="center" gap={ 1 } className="nitro-catalog-toolbar-actions">
                            <div className="nitro-catalog-store-settings-wrapper">
                                <button
                                    type="button"
                                    className={ `nitro-catalog-toolbar-button ${ storeSettingsVisible ? 'active' : '' }` }
                                    onClick={ () => setStoreSettingsVisible(value => !value) }
                                    title="Configurações da Loja"
                                >
                                    <FaCog className="fa-icon" />
                                    <span className="nitro-catalog-toolbar-label">Configurações da Loja</span>
                                </button>

                                { storeSettingsVisible &&
                                    <div className="nitro-catalog-store-settings-popover">
                                        <div className="nitro-catalog-store-settings-title">Configurações da Loja</div>

                                        <label className="nitro-catalog-store-settings-row">
                                            <input
                                                type="checkbox"
                                                checked={ showFavorites }
                                                onChange={ toggleFavoritesPreference }
                                            />
                                            <span>Mostrar Meus Favoritos</span>
                                        </label>

                                        <label className="nitro-catalog-store-settings-row">
                                            <input
                                                type="checkbox"
                                                checked={ showRecents }
                                                onChange={ toggleRecentsPreference }
                                            />
                                            <span>Mostrar Vistos Recentemente</span>
                                        </label>
                                    </div>
                                }
                            </div>

                            <button
                                type="button"
                                className={ `nitro-catalog-toolbar-button ${ isExpanded ? 'active' : '' }` }
                                onClick={ toggleExpanded }
                                title={
                                    isExpanded
                                        ? 'Voltar ao tamanho normal'
                                        : 'Expandir catálogo'
                                }
                            >
                                <span className="nitro-catalog-toolbar-icon">
                                    { isExpanded ? '↙' : '⛶' }
                                </span>

                                <span className="nitro-catalog-toolbar-label">
                                    { isExpanded ? 'Normal' : 'Expandir' }
                                </span>
                            </button>
                        </Flex>
                    </Flex>

                    <NitroCardContentView className="nitro-catalog-content">
                        <Grid className="nitro-catalog-main-grid">

                            { !navigationHidden &&
                                <Column
                                    size={ 3 }
                                    overflow="auto"
                                    className="nitro-catalog-navigation-column"
                                >
                                    { activeNodes &&
                                        (activeNodes.length > 0) &&
                                        <CatalogNavigationView node={ activeNodes[0] } /> }
                                </Column>
                            }

                            <Column
                                size={ !navigationHidden ? 9 : 12 }
                                overflow="auto"
                                className="nitro-catalog-layout-column"
                            >
                                {
                                    GetCatalogLayout(
                                        currentPage,
                                        () => setNavigationHidden(true)
                                    )
                                }
                            </Column>

                        </Grid>
                    </NitroCardContentView>
                </NitroCardView>
            }

            <CatalogGiftView />
            <MarketplacePostOfferView />
        </>
    );
};
