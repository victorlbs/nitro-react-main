import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { FaBolt, FaBoxOpen, FaCog, FaCompass, FaHeart, FaHome, FaMedal, FaQuestionCircle, FaSearch, FaShoppingCart, FaTimes, FaTools, FaUserFriends } from 'react-icons/fa';
import { CreateLinkEvent, VisitDesktop } from '../../api';
import { Base } from '../../common';
import './NitroPlusView.scss';

type NitroPlusAction =
{
    id: string;
    label: string;
    description: string;
    keywords: string;
    icon: JSX.Element;
    run: () => void;
};

type StoredActivity =
{
    id: string;
    label: string;
    timestamp: number;
};

const STORAGE_FAVORITES = 'nitro.plus.favorites';
const STORAGE_ACTIVITY = 'nitro.plus.activity';
const STORAGE_ONBOARDING = 'nitro.plus.onboarding.seen';

const readJson = <T,>(key: string, fallback: T): T =>
{
    try
    {
        const value = localStorage.getItem(key);

        return value ? JSON.parse(value) as T : fallback;
    }
    catch
    {
        return fallback;
    }
};

export const NitroPlusView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ search, setSearch ] = useState('');
    const [ favorites, setFavorites ] = useState<string[]>(() => readJson(STORAGE_FAVORITES, []));
    const [ activity, setActivity ] = useState<StoredActivity[]>(() => readJson(STORAGE_ACTIVITY, []));
    const [ showTips, setShowTips ] = useState(() => localStorage.getItem(STORAGE_ONBOARDING) !== '1');
    const inputRef = useRef<HTMLInputElement>(null);

    const runLink = (link: string) => CreateLinkEvent(link);

    const actions = useMemo<NitroPlusAction[]>(() => [
        {
            id: 'home',
            label: 'Ir para o Hotel',
            description: 'Voltar para a visão principal do hotel.',
            keywords: 'home hotel desktop início',
            icon: <FaHome />,
            run: () => VisitDesktop()
        },
        {
            id: 'navigator',
            label: 'Navegador de quartos',
            description: 'Encontrar quartos, eventos, amigos e lugares populares.',
            keywords: 'quartos navegador sala evento entrar',
            icon: <FaCompass />,
            run: () => runLink('navigator/toggle')
        },
        {
            id: 'inventory',
            label: 'Inventário',
            description: 'Abrir seus mobis, pets, emblemas e itens.',
            keywords: 'inventário mobi mobis item itens pet badge emblema',
            icon: <FaBoxOpen />,
            run: () => runLink('inventory/toggle')
        },
        {
            id: 'catalog',
            label: 'Catálogo',
            description: 'Comprar mobis, roupas e outros itens.',
            keywords: 'catálogo loja comprar mobis roupa',
            icon: <FaShoppingCart />,
            run: () => runLink('catalog/toggle')
        },
        {
            id: 'friends',
            label: 'Amigos e mensagens',
            description: 'Abrir sua lista de amigos e conversas.',
            keywords: 'amigos mensagens messenger conversa chat privado',
            icon: <FaUserFriends />,
            run: () => runLink('friends/toggle')
        },
        {
            id: 'achievements',
            label: 'Conquistas',
            description: 'Acompanhar emblemas, níveis e progresso.',
            keywords: 'conquistas achievement emblemas progresso nível',
            icon: <FaMedal />,
            run: () => runLink('achievements/toggle')
        },
        {
            id: 'settings',
            label: 'Configurações',
            description: 'Ajustar aparência, áudio, vídeo e privacidade.',
            keywords: 'configurações opções aparência tema som vídeo privacidade',
            icon: <FaCog />,
            run: () => runLink('user-settings/toggle')
        },
        {
            id: 'floor-editor',
            label: 'Editor de chão',
            description: 'Editar o mapa e a estrutura do quarto.',
            keywords: 'construtor builder floorplan chão mapa quarto editar',
            icon: <FaTools />,
            run: () => runLink('floor-editor/toggle')
        },
        {
            id: 'help',
            label: 'Ajuda e segurança',
            description: 'Abrir a central de ajuda e denúncias.',
            keywords: 'ajuda suporte segurança denúncia report',
            icon: <FaQuestionCircle />,
            run: () => runLink('help/toggle')
        }
    ], []);

    const filteredActions = useMemo(() =>
    {
        const term = search.trim().toLowerCase();

        if(!term) return actions;

        return actions.filter(action => (`${ action.label } ${ action.description } ${ action.keywords }`).toLowerCase().includes(term));
    }, [ actions, search ]);

    const favoriteActions = useMemo(() => favorites.map(id => actions.find(action => action.id === id)).filter(Boolean) as NitroPlusAction[], [ actions, favorites ]);

    const executeAction = (action: NitroPlusAction) =>
    {
        action.run();

        const nextActivity: StoredActivity[] = [
            { id: `${ Date.now() }-${ action.id }`, label: action.label, timestamp: Date.now() },
            ...activity.filter(item => item.label !== action.label)
        ].slice(0, 8);

        setActivity(nextActivity);
        localStorage.setItem(STORAGE_ACTIVITY, JSON.stringify(nextActivity));
        setIsVisible(false);
        setSearch('');
    };

    const toggleFavorite = (id: string) =>
    {
        const next = favorites.includes(id) ? favorites.filter(item => item !== id) : [ ...favorites, id ];
        setFavorites(next);
        localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(next));
    };

    const dismissTips = () =>
    {
        setShowTips(false);
        localStorage.setItem(STORAGE_ONBOARDING, '1');
    };

    useEffect(() =>
    {
        const handler = (event: KeyboardEvent) =>
        {
            const target = event.target as HTMLElement | null;
            const isTyping = target && ([ 'INPUT', 'TEXTAREA', 'SELECT' ].includes(target.tagName) || target.isContentEditable);

            if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')
            {
                event.preventDefault();
                setIsVisible(value => !value);
                return;
            }

            if(isTyping) return;

            if(event.altKey && event.key.toLowerCase() === 'i') executeAction(actions.find(action => action.id === 'inventory')!);
            if(event.altKey && event.key.toLowerCase() === 'n') executeAction(actions.find(action => action.id === 'navigator')!);
            if(event.altKey && event.key.toLowerCase() === 'c') executeAction(actions.find(action => action.id === 'catalog')!);
            if(event.altKey && event.key.toLowerCase() === 'a') executeAction(actions.find(action => action.id === 'friends')!);
            if(event.key === 'Escape') setIsVisible(false);
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [ actions, activity ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        window.setTimeout(() => inputRef.current?.focus(), 30);
    }, [ isVisible ]);

    return (
        <>
            <Base pointer className="nitro-plus-floating-button" onClick={ () => setIsVisible(true) } title="Central rápida (Ctrl+K)">
                <FaBolt />
            </Base>

            { showTips &&
                <div className="nitro-plus-welcome">
                    <button type="button" className="nitro-plus-close" onClick={ dismissTips } aria-label="Fechar"><FaTimes /></button>
                    <strong>Central Nitro+</strong>
                    <span>Pressione <kbd>Ctrl</kbd> + <kbd>K</kbd> para abrir qualquer área rapidamente.</span>
                    <button type="button" onClick={ () => { dismissTips(); setIsVisible(true); } }>Conhecer agora</button>
                </div> }

            { isVisible &&
                <div className="nitro-plus-overlay" onMouseDown={ event => { if(event.target === event.currentTarget) setIsVisible(false); } }>
                    <section className="nitro-plus-panel" role="dialog" aria-modal="true" aria-label="Central Nitro+">
                        <header className="nitro-plus-header">
                            <div>
                                <FaBolt />
                                <span>Central Nitro+</span>
                            </div>
                            <button type="button" onClick={ () => setIsVisible(false) } aria-label="Fechar"><FaTimes /></button>
                        </header>

                        <div className="nitro-plus-search">
                            <FaSearch />
                            <input ref={ inputRef } value={ search } onChange={ event => setSearch(event.target.value) } placeholder="Pesquisar uma ação, janela ou recurso..." />
                            <kbd>ESC</kbd>
                        </div>

                        { !search && favoriteActions.length > 0 &&
                            <div className="nitro-plus-section">
                                <div className="nitro-plus-section-title"><FaHeart /> Favoritos</div>
                                <div className="nitro-plus-favorite-grid">
                                    { favoriteActions.map(action =>
                                        <button key={ action.id } type="button" onClick={ () => executeAction(action) }>
                                            { action.icon }
                                            <span>{ action.label }</span>
                                        </button>) }
                                </div>
                            </div> }

                        <div className="nitro-plus-section nitro-plus-results">
                            <div className="nitro-plus-section-title">{ search ? 'Resultados' : 'Todas as ações' }</div>
                            { filteredActions.length === 0 && <div className="nitro-plus-empty">Nenhuma ação encontrada.</div> }
                            { filteredActions.map(action =>
                                <div key={ action.id } className="nitro-plus-action-row">
                                    <button type="button" className="nitro-plus-action-main" onClick={ () => executeAction(action) }>
                                        <span className="nitro-plus-action-icon">{ action.icon }</span>
                                        <span className="nitro-plus-action-copy">
                                            <strong>{ action.label }</strong>
                                            <small>{ action.description }</small>
                                        </span>
                                    </button>
                                    <button type="button" className={ `nitro-plus-favorite-toggle ${ favorites.includes(action.id) ? 'active' : '' }` } onClick={ () => toggleFavorite(action.id) } title="Favoritar">
                                        <FaHeart />
                                    </button>
                                </div>) }
                        </div>

                        { !search && activity.length > 0 &&
                            <div className="nitro-plus-section nitro-plus-recent">
                                <div className="nitro-plus-section-title">Usados recentemente</div>
                                <div className="nitro-plus-recent-list">
                                    { activity.slice(0, 5).map(item =>
                                    {
                                        const action = actions.find(entry => entry.label === item.label);
                                        if(!action) return null;

                                        return <button key={ item.id } type="button" onClick={ () => executeAction(action) }>{ item.label }</button>;
                                    }) }
                                </div>
                            </div> }

                        <footer className="nitro-plus-footer">
                            <span><kbd>Alt</kbd>+<kbd>I</kbd> Inventário</span>
                            <span><kbd>Alt</kbd>+<kbd>N</kbd> Navegador</span>
                            <span><kbd>Alt</kbd>+<kbd>C</kbd> Catálogo</span>
                            <span><kbd>Alt</kbd>+<kbd>A</kbd> Amigos</span>
                        </footer>
                    </section>
                </div> }
        </>
    );
};
