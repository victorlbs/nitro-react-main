import { FC, MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './HabbiconsView.scss';

interface HabbiconsViewProps
{
    onClose: () => void;
}

type HabbiconItem = {
    id: number;
    icon: string;
    owned: boolean;
};

type HabbiconCollection = {
    id: number;
    name: string;
    description: string;
    icon: string;
    rewardIcon: string;
    favorite: boolean;
    items: HabbiconItem[];
};

const COLLECTIONS: HabbiconCollection[] = [
    {
        id: 1,
        name: 'Duckicons',
        description: 'Quack! Expresse-se com Habbicons temáticos de pato',
        icon: '🦆',
        rewardIcon: '🦆',
        favorite: true,
        items: [
            { id: 1, icon: '🦆', owned: false },
            { id: 2, icon: '😆', owned: false },
            { id: 3, icon: '🥹', owned: false },
            { id: 4, icon: '🤓', owned: false },
            { id: 5, icon: '😴', owned: false },
            { id: 6, icon: '😮', owned: false },
            { id: 7, icon: '😉', owned: false },
            { id: 8, icon: '😚', owned: false },
            { id: 9, icon: '🥶', owned: false },
            { id: 10, icon: '😡', owned: false }
        ]
    },
    {
        id: 2,
        name: 'Duckicons 2',
        description: 'Mais expressões e reações para sua coleção de Duckicons',
        icon: '🐥',
        rewardIcon: '🐥',
        favorite: false,
        items: [
            { id: 11, icon: '🐥', owned: false },
            { id: 12, icon: '😂', owned: false },
            { id: 13, icon: '😍', owned: false },
            { id: 14, icon: '🤯', owned: false },
            { id: 15, icon: '😎', owned: false },
            { id: 16, icon: '🤔', owned: false },
            { id: 17, icon: '🥳', owned: false },
            { id: 18, icon: '😭', owned: false },
            { id: 19, icon: '😤', owned: false },
            { id: 20, icon: '🤩', owned: false }
        ]
    },
    {
        id: 3,
        name: 'Frankicons',
        description: 'Uma coleção clássica de Habbicons do Frank',
        icon: '👨',
        rewardIcon: '🎩',
        favorite: false,
        items: [
            { id: 21, icon: '👨', owned: false },
            { id: 22, icon: '🎩', owned: false },
            { id: 23, icon: '☕', owned: false },
            { id: 24, icon: '🛎️', owned: false },
            { id: 25, icon: '🧳', owned: false },
            { id: 26, icon: '🕴️', owned: false },
            { id: 27, icon: '😐', owned: false },
            { id: 28, icon: '🙂', owned: false },
            { id: 29, icon: '🙄', owned: false },
            { id: 30, icon: '😄', owned: false },
            { id: 31, icon: '🧐', owned: false },
            { id: 32, icon: '👋', owned: false },
            { id: 33, icon: '⭐', owned: false }
        ]
    }
];

type TabType = 'all' | 'owned' | 'favorites';

export const HabbiconsView: FC<HabbiconsViewProps> = ({ onClose }) =>
{
    const [ activeTab, setActiveTab ] = useState<TabType>('all');
    const [ selectedCollectionId, setSelectedCollectionId ] = useState<number>(COLLECTIONS[0].id);
    const [ collections, setCollections ] = useState<HabbiconCollection[]>(COLLECTIONS);

    // Controle de arraste da janela
    const windowRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const [ position, setPosition ] = useState({ x: 0, y: 0 });

    const totalItems = useMemo(
        () => collections.reduce((total, collection) => total + collection.items.length, 0),
        [ collections ]
    );

    const ownedItems = useMemo(
        () => collections.reduce(
            (total, collection) => total + collection.items.filter(item => item.owned).length,
            0
        ),
        [ collections ]
    );

    const completedCollections = useMemo(
        () => collections.filter(
            collection => collection.items.length > 0 && collection.items.every(item => item.owned)
        ).length,
        [ collections ]
    );

    const visibleCollections = useMemo(() =>
    {
        switch(activeTab)
        {
            case 'owned':
                return collections.filter(collection => collection.items.some(item => item.owned));

            case 'favorites':
                return collections.filter(collection => collection.favorite);

            default:
                return collections;
        }
    }, [ activeTab, collections ]);

    const selectedCollection =
        collections.find(collection => collection.id === selectedCollectionId) ??
        visibleCollections[0] ??
        collections[0];

    const selectedOwnedCount = selectedCollection
        ? selectedCollection.items.filter(item => item.owned).length
        : 0;

    const selectedCompleted = selectedCollection
        ? selectedCollection.items.length > 0 && selectedCollection.items.every(item => item.owned)
        : false;

    const progress = totalItems > 0 ? Math.round((ownedItems / totalItems) * 100) : 0;

    const toggleFavorite = (collectionId: number) =>
    {
        setCollections(current =>
            current.map(collection =>
                collection.id === collectionId
                    ? { ...collection, favorite: !collection.favorite }
                    : collection
            )
        );
    };

    const startDragging = (event: ReactMouseEvent<HTMLDivElement>) =>
    {
        // Não inicia o arraste ao clicar no botão de fechar
        if((event.target as HTMLElement).closest('.habbicons-close-button')) return;

        draggingRef.current = true;
        dragOffsetRef.current = {
            x: event.clientX - position.x,
            y: event.clientY - position.y
        };

        document.body.classList.add('habbicons-is-dragging');
        event.preventDefault();
    };

    useEffect(() =>
    {
        const onMouseMove = (event: MouseEvent) =>
        {
            if(!draggingRef.current || !windowRef.current) return;

            const rect = windowRef.current.getBoundingClientRect();

            let nextX = event.clientX - dragOffsetRef.current.x;
            let nextY = event.clientY - dragOffsetRef.current.y;

            // Mantém pelo menos uma parte da janela visível na tela
            const minVisible = 80;
            const left = rect.left - position.x;
            const top = rect.top - position.y;

            const minX = -left - rect.width + minVisible;
            const maxX = window.innerWidth - left - minVisible;
            const minY = -top;
            const maxY = window.innerHeight - top - minVisible;

            nextX = Math.max(minX, Math.min(maxX, nextX));
            nextY = Math.max(minY, Math.min(maxY, nextY));

            setPosition({ x: nextX, y: nextY });
        };

        const onMouseUp = () =>
        {
            if(!draggingRef.current) return;

            draggingRef.current = false;
            document.body.classList.remove('habbicons-is-dragging');
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () =>
        {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.classList.remove('habbicons-is-dragging');
        };
    }, [ position.x, position.y ]);

    return createPortal(
        <div className="habbicons-window-backdrop" onMouseDown={ onClose }>
            <div
                ref={ windowRef }
                className="habbicons-window"
                style={{
                    transform: `translate3d(${ position.x }px, ${ position.y }px, 0)`
                }}
                onMouseDown={ event => event.stopPropagation() }
            >
                <div className="habbicons-window-header" onMouseDown={ startDragging }>
                    <span>Coleção de Habbicons</span>

                    <button
                        type="button"
                        className="habbicons-close-button"
                        onClick={ onClose }
                        aria-label="Fechar"
                    >
                        ×
                    </button>
                </div>

                <div className="habbicons-hero">
                    <div className="habbicons-hero-left">
                        <div className="habbicons-main-icon">
                            <img src="//cdn.comprahabbo.com/img/habbicon.png" alt="" />
                        </div>

                        <div>
                            <h2>Habbicons</h2>
                            <p>
                                Faça coleções, desbloqueie Habbicons animados
                                e use-os dentro dos quartos!
                            </p>
                        </div>
                    </div>

                    <div className="habbicons-stat-cards">
                        <div className="habbicons-stat-card">
                            <span>Habbicons Possuídos</span>
                            <strong>{ ownedItems }</strong>
                        </div>

                        <div className="habbicons-stat-card">
                            <span>Coleções concluídas</span>
                            <strong>{ completedCollections }</strong>
                        </div>
                    </div>

                    <div className="habbicons-total-progress">
                        <div className="habbicons-progress-track">
                            <div
                                className="habbicons-progress-fill"
                                style={{ width: `${ progress }%` }}
                            />
                        </div>

                        <strong>
                            { ownedItems } / { totalItems }
                        </strong>
                    </div>
                </div>

                <div className="habbicons-tabs">
                    <button
                        type="button"
                        className={ activeTab === 'all' ? 'active' : '' }
                        onClick={ () => setActiveTab('all') }
                    >
                        Todas as Coleções
                    </button>

                    <button
                        type="button"
                        className={ activeTab === 'owned' ? 'active' : '' }
                        onClick={ () => setActiveTab('owned') }
                    >
                        Possuídos
                    </button>

                    <button
                        type="button"
                        className={ activeTab === 'favorites' ? 'active' : '' }
                        onClick={ () => setActiveTab('favorites') }
                    >
                        Favoritados
                    </button>
                </div>

                <div className="habbicons-body">
                    <aside className="habbicons-collection-list">
                        { visibleCollections.length === 0 &&
                            <div className="habbicons-empty-list">
                                Nenhuma coleção nesta aba.
                            </div> }

                        { visibleCollections.map(collection =>
                            <button
                                type="button"
                                key={ collection.id }
                                className={
                                    `habbicons-collection-row ${
                                        selectedCollection?.id === collection.id ? 'active' : ''
                                    }`
                                }
                                onClick={ () => setSelectedCollectionId(collection.id) }
                            >
                                <span className="habbicons-collection-avatar">
                                    { collection.icon }
                                </span>

                                <span className="habbicons-collection-info">
                                    <strong>{ collection.name }</strong>

                                    <span className="habbicons-mini-progress">
                                        <span
                                            style={{
                                                width: `${
                                                    collection.items.length
                                                        ? (collection.items.filter(item => item.owned).length / collection.items.length) * 100
                                                        : 0
                                                }%`
                                            }}
                                        />
                                    </span>
                                </span>

                                <span
                                    className={ `habbicons-favorite ${ collection.favorite ? 'active' : '' }` }
                                    onClick={ event =>
                                    {
                                        event.stopPropagation();
                                        toggleFavorite(collection.id);
                                    } }
                                    title="Favoritar coleção"
                                >
                                    ★
                                </span>
                            </button>
                        ) }
                    </aside>

                    <section className="habbicons-collection-content">
                        { selectedCollection &&
                            <>
                                <div className="habbicons-collection-title">
                                    <div>
                                        <h3>{ selectedCollection.name }</h3>
                                        <p>{ selectedCollection.description }</p>
                                    </div>

                                    <button
                                        type="button"
                                        className={ `habbicons-title-favorite ${
                                            selectedCollection.favorite ? 'active' : ''
                                        }` }
                                        onClick={ () => toggleFavorite(selectedCollection.id) }
                                    >
                                        ★
                                    </button>
                                </div>

                                <div className="habbicons-selected-progress">
                                    <div className="habbicons-progress-track">
                                        <div
                                            className="habbicons-progress-fill"
                                            style={{
                                                width: `${
                                                    selectedCollection.items.length
                                                        ? (selectedOwnedCount / selectedCollection.items.length) * 100
                                                        : 0
                                                }%`
                                            }}
                                        />
                                    </div>

                                    <strong>
                                        { selectedOwnedCount } / { selectedCollection.items.length }
                                    </strong>
                                </div>

                                <div className="habbicons-content-lower">
                                    <div className="habbicons-grid">
                                        { selectedCollection.items.map(item =>
                                            <div
                                                key={ item.id }
                                                className={ `habbicon-cell ${ item.owned ? 'owned' : 'locked' }` }
                                                title={ item.owned ? 'Habbicon possuído' : 'Habbicon ainda não desbloqueado' }
                                            >
                                                <span>{ item.icon }</span>

                                                { !item.owned &&
                                                    <span className="habbicon-lock-overlay" /> }
                                            </div>
                                        ) }
                                    </div>

                                    <div className="habbicons-reward">
                                        <h4>Verificar recompensa</h4>

                                        <div className="habbicons-reward-icon">
                                            { selectedCollection.rewardIcon }
                                        </div>

                                        <p>
                                            Complete esta coleção para desbloquear a recompensa
                                        </p>

                                        <button
                                            type="button"
                                            disabled={ !selectedCompleted }
                                        >
                                            Resgatar
                                        </button>
                                    </div>
                                </div>
                            </> }
                    </section>
                </div>
            </div>
        </div>,
        document.body
    );
};
