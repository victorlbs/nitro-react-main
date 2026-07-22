import { AvatarEditorFigureCategory, FigureSetIdsMessageEvent, GetWardrobeMessageComposer, IAvatarFigureContainer, ILinkEventTracker, UserFigureComposer, UserWardrobePageEvent } from '@nitrots/nitro-renderer';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FaClipboard, FaCopy, FaDice, FaHistory, FaPaste, FaStar, FaTrash, FaUndo } from 'react-icons/fa';
import { AddEventLinkTracker, AvatarEditorAction, AvatarEditorUtilities, BodyModel, FigureData, generateRandomFigure, GetAvatarRenderManager, GetClubMemberLevel, GetConfiguration, GetSessionDataManager, HeadModel, IAvatarEditorCategoryModel, LegModel, LocalizeText, RemoveLinkEventTracker, SendMessageComposer, TorsoModel } from '../../api';
import { Button, ButtonGroup, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView } from '../../common';
import { useMessageEvent } from '../../hooks';
import './AvatarEditorView.scss';
import { AvatarEditorFigurePreviewView } from './views/AvatarEditorFigurePreviewView';
import { AvatarEditorModelView } from './views/AvatarEditorModelView';
import { AvatarEditorWardrobeView } from './views/AvatarEditorWardrobeView';

const DEFAULT_MALE_FIGURE: string = 'hr-100.hd-180-7.ch-215-66.lg-270-79.sh-305-62.ha-1002-70.wa-2007';
const DEFAULT_FEMALE_FIGURE: string = 'hr-515-33.hd-600-1.ch-635-70.lg-716-66-62.sh-735-68';

const FAVORITE_LOOKS_STORAGE_KEY = 'nitro.avatar.editor.favorite.looks.v1';
const RECENT_LOOKS_STORAGE_KEY = 'nitro.avatar.editor.recent.looks.v1';
const MAX_RECENT_LOOKS = 12;
const MAX_FAVORITE_LOOKS = 24;

type AvatarEditorUtilityPanel = 'none' | 'favorites' | 'recent' | 'presets' | 'import';

interface StoredAvatarLook
{
    id: string;
    name: string;
    figure: string;
    gender: string;
    createdAt: number;
}

const PRESET_LOOKS: StoredAvatarLook[] = [
    {
        id: 'preset-male-classic',
        name: 'Clássico masculino',
        figure: DEFAULT_MALE_FIGURE,
        gender: FigureData.MALE,
        createdAt: 0
    },
    {
        id: 'preset-female-classic',
        name: 'Clássico feminino',
        figure: DEFAULT_FEMALE_FIGURE,
        gender: FigureData.FEMALE,
        createdAt: 0
    },
    {
        id: 'preset-rich-male',
        name: 'Social rico',
        figure: 'hr-828-45.hd-180-1.ch-255-92.lg-275-82.sh-290-92.ea-1404-110',
        gender: FigureData.MALE,
        createdAt: 0
    },
    {
        id: 'preset-party-male',
        name: 'Balada',
        figure: 'hr-828-61.hd-180-1.ch-210-92.lg-270-110.sh-290-92.ea-1401-92',
        gender: FigureData.MALE,
        createdAt: 0
    },
    {
        id: 'preset-clean-female',
        name: 'Elegante feminina',
        figure: 'hr-515-45.hd-600-1.ch-660-92.lg-716-82.sh-735-92',
        gender: FigureData.FEMALE,
        createdAt: 0
    },
    {
        id: 'preset-soft-female',
        name: 'Casual feminina',
        figure: 'hr-545-45.hd-600-1.ch-635-70.lg-720-66.sh-735-68',
        gender: FigureData.FEMALE,
        createdAt: 0
    }
];

const readStoredLooks = (key: string): StoredAvatarLook[] =>
{
    try
    {
        const raw = window.localStorage.getItem(key);

        if(!raw) return [];

        const parsed = JSON.parse(raw);

        if(!Array.isArray(parsed)) return [];

        return parsed.filter(item => item && item.figure && item.gender);
    }
    catch
    {
        return [];
    }
};

const writeStoredLooks = (key: string, looks: StoredAvatarLook[]) =>
{
    window.localStorage.setItem(key, JSON.stringify(looks));
};

const createLookId = (figure: string, gender: string) =>
{
    let hash = 0;
    const value = `${ gender }:${ figure }`;

    for(let i = 0; i < value.length; i++) hash = ((hash << 5) - hash) + value.charCodeAt(i);

    return `look-${ Math.abs(hash) }`;
};

const createLookName = (gender: string) =>
{
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const label = (AvatarEditorUtilities.getGender(gender) === FigureData.FEMALE) ? 'Feminino' : 'Masculino';

    return `${ label } ${ day }/${ month } ${ hours }:${ minutes }`;
};

export const AvatarEditorView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ figures, setFigures ] = useState<Map<string, FigureData>>(null);
    const [ figureData, setFigureData ] = useState<FigureData>(null);
    const [ categories, setCategories ] = useState<Map<string, IAvatarEditorCategoryModel>>(null);
    const [ activeCategory, setActiveCategory ] = useState<IAvatarEditorCategoryModel>(null);
    const [ figureSetIds, setFigureSetIds ] = useState<number[]>([]);
    const [ boundFurnitureNames, setBoundFurnitureNames ] = useState<string[]>([]);
    const [ savedFigures, setSavedFigures ] = useState<[ IAvatarFigureContainer, string ][]>([]);
    const [ isWardrobeVisible, setIsWardrobeVisible ] = useState(false);
    const [ lastFigure, setLastFigure ] = useState<string>(null);
    const [ lastGender, setLastGender ] = useState<string>(null);
    const [ needsReset, setNeedsReset ] = useState(true);
    const [ isInitalized, setIsInitalized ] = useState(false);
    const [ utilityPanel, setUtilityPanel ] = useState<AvatarEditorUtilityPanel>('none');
    const [ favoriteLooks, setFavoriteLooks ] = useState<StoredAvatarLook[]>([]);
    const [ recentLooks, setRecentLooks ] = useState<StoredAvatarLook[]>([]);
    const [ importFigureText, setImportFigureText ] = useState('');
    const [ feedbackMessage, setFeedbackMessage ] = useState('');

    const maxWardrobeSlots = useMemo(() => GetConfiguration<number>('avatar.wardrobe.max.slots', 10), []);

    const currentFigure = figureData ? figureData.getFigureString() : '';
    const hasChanges = !!(figureData && lastFigure && ((currentFigure !== lastFigure) || (figureData.gender !== lastGender)));
    const isCurrentFavorite = !!(figureData && favoriteLooks.some(look => look.figure === currentFigure && look.gender === figureData.gender));

    const activeSectionName = isWardrobeVisible
        ? LocalizeText('avatareditor.category.wardrobe')
        : (activeCategory ? LocalizeText(`avatareditor.category.${ activeCategory.name }`) : '');

    useMessageEvent<FigureSetIdsMessageEvent>(FigureSetIdsMessageEvent, event =>
    {
        const parser = event.getParser();

        setFigureSetIds(parser.figureSetIds);
        setBoundFurnitureNames(parser.boundsFurnitureNames);
    });

    useMessageEvent<UserWardrobePageEvent>(UserWardrobePageEvent, event =>
    {
        const parser = event.getParser();
        const savedFigures: [ IAvatarFigureContainer, string ][] = [];

        let i = 0;

        while(i < maxWardrobeSlots)
        {
            savedFigures.push([ null, null ]);

            i++;
        }

        for(let [ index, [ look, gender ] ] of parser.looks.entries())
        {
            const container = GetAvatarRenderManager().createFigureContainer(look);

            savedFigures[(index - 1)] = [ container, gender ];
        }

        setSavedFigures(savedFigures);
    });

    const showFeedback = useCallback((message: string) =>
    {
        setFeedbackMessage(message);

        window.setTimeout(() => setFeedbackMessage(''), 2600);
    }, []);

    const selectCategory = useCallback((name: string) =>
    {
        if(!categories) return;
        
        setActiveCategory(categories.get(name));
        setUtilityPanel('none');
    }, [ categories ]);

    const resetCategories = useCallback(() =>
    {
        const categories = new Map();

        categories.set(AvatarEditorFigureCategory.GENERIC, new BodyModel());
        categories.set(AvatarEditorFigureCategory.HEAD, new HeadModel());
        categories.set(AvatarEditorFigureCategory.TORSO, new TorsoModel());
        categories.set(AvatarEditorFigureCategory.LEGS, new LegModel());

        setCategories(categories);
    }, []);

    const setupFigures = useCallback(() =>
    {
        const figures: Map<string, FigureData> = new Map();

        const maleFigure = new FigureData();
        const femaleFigure = new FigureData();

        maleFigure.loadAvatarData(DEFAULT_MALE_FIGURE, FigureData.MALE);
        femaleFigure.loadAvatarData(DEFAULT_FEMALE_FIGURE, FigureData.FEMALE);

        figures.set(FigureData.MALE, maleFigure);
        figures.set(FigureData.FEMALE, femaleFigure);

        setFigures(figures);
        setFigureData(figures.get(FigureData.MALE));
    }, []);

    const addRecentLook = useCallback((figure: string, gender: string) =>
    {
        if(!figure || !gender) return;

        const look: StoredAvatarLook = {
            id: createLookId(figure, gender),
            name: createLookName(gender),
            figure,
            gender,
            createdAt: Date.now()
        };

        setRecentLooks(prevValue =>
        {
            const nextValue = [ look, ...prevValue.filter(item => !(item.figure === figure && item.gender === gender)) ].slice(0, MAX_RECENT_LOOKS);

            writeStoredLooks(RECENT_LOOKS_STORAGE_KEY, nextValue);

            return nextValue;
        });
    }, []);

    const loadAvatarInEditor = useCallback((figure: string, gender: string, reset: boolean = true) =>
    {
        if(!figures || !figureData || !figure) return;

        gender = AvatarEditorUtilities.getGender(gender);

        let newFigureData = figureData;

        if(gender !== newFigureData.gender) newFigureData = figures.get(gender);

        if(!newFigureData) return;

        if(figure !== newFigureData.getFigureString()) newFigureData.loadAvatarData(figure, gender);

        if(newFigureData !== figureData) setFigureData(newFigureData);

        addRecentLook(figure, gender);

        if(reset)
        {
            setLastFigure(figure);
            setLastGender(gender);
        }
    }, [ figures, figureData, addRecentLook ]);

    const applyLook = useCallback((look: StoredAvatarLook) =>
    {
        if(!look) return;

        loadAvatarInEditor(look.figure, look.gender, false);
        resetCategories();
        setUtilityPanel('none');
        showFeedback('Visual aplicado.');
    }, [ loadAvatarInEditor, resetCategories, showFeedback ]);

    const saveFavoriteLook = useCallback(() =>
    {
        if(!figureData) return;

        const figure = figureData.getFigureString();
        const gender = figureData.gender;

        if(favoriteLooks.some(look => look.figure === figure && look.gender === gender))
        {
            showFeedback('Esse visual já está nos favoritos.');
            return;
        }

        const look: StoredAvatarLook = {
            id: createLookId(figure, gender),
            name: createLookName(gender),
            figure,
            gender,
            createdAt: Date.now()
        };

        setFavoriteLooks(prevValue =>
        {
            const nextValue = [ look, ...prevValue ].slice(0, MAX_FAVORITE_LOOKS);

            writeStoredLooks(FAVORITE_LOOKS_STORAGE_KEY, nextValue);

            return nextValue;
        });

        showFeedback('Visual adicionado aos favoritos.');
    }, [ figureData, favoriteLooks, showFeedback ]);

    const removeFavoriteLook = useCallback((look: StoredAvatarLook) =>
    {
        setFavoriteLooks(prevValue =>
        {
            const nextValue = prevValue.filter(item => item.id !== look.id);

            writeStoredLooks(FAVORITE_LOOKS_STORAGE_KEY, nextValue);

            return nextValue;
        });

        showFeedback('Favorito removido.');
    }, [ showFeedback ]);

    const clearRecentLooks = useCallback(() =>
    {
        setRecentLooks([]);
        writeStoredLooks(RECENT_LOOKS_STORAGE_KEY, []);
        showFeedback('Recentes limpos.');
    }, [ showFeedback ]);

    const copyCurrentFigure = useCallback(() =>
    {
        if(!figureData) return;

        const figure = figureData.getFigureString();

        addRecentLook(figure, figureData.gender);

        if(navigator.clipboard && navigator.clipboard.writeText)
        {
            navigator.clipboard.writeText(figure)
                .then(() => showFeedback('Visual copiado.'))
                .catch(() =>
                {
                    window.prompt('Copie o visual:', figure);
                    showFeedback('Copie o visual na caixa aberta.');
                });

            return;
        }

        window.prompt('Copie o visual:', figure);
    }, [ figureData, addRecentLook, showFeedback ]);

    const applyFigureFromText = useCallback((rawValue: string) =>
    {
        if(!figureData) return;

        let value = String(rawValue || '').trim();

        if(!value.length)
        {
            showFeedback('Cole um figure válido primeiro.');
            return;
        }

        let gender = figureData.gender;

        if(value.toLowerCase().startsWith('m:'))
        {
            gender = FigureData.MALE;
            value = value.substring(2).trim();
        }
        else if(value.toLowerCase().startsWith('f:'))
        {
            gender = FigureData.FEMALE;
            value = value.substring(2).trim();
        }

        if(!value.includes('-') || !value.includes('.'))
        {
            showFeedback('Esse figure parece inválido.');
            return;
        }

        loadAvatarInEditor(value, gender, false);
        resetCategories();
        setImportFigureText('');
        setUtilityPanel('none');
        showFeedback('Visual importado.');
    }, [ figureData, loadAvatarInEditor, resetCategories, showFeedback ]);

    const pasteFromClipboard = useCallback(() =>
    {
        if(!navigator.clipboard || !navigator.clipboard.readText)
        {
            showFeedback('Seu navegador não liberou leitura da área de transferência.');
            return;
        }

        navigator.clipboard.readText()
            .then(text =>
            {
                setImportFigureText(text);
                applyFigureFromText(text);
            })
            .catch(() => showFeedback('Não foi possível ler a área de transferência.'));
    }, [ applyFigureFromText, showFeedback ]);

    const processAction = useCallback((action: string) =>
    {
        if(!figureData) return;

        switch(action)
        {
            case AvatarEditorAction.ACTION_CLEAR:
                loadAvatarInEditor(figureData.getFigureStringWithFace(0, false), figureData.gender, false);
                resetCategories();
                showFeedback('Rosto limpo.');
                return;
            case AvatarEditorAction.ACTION_RESET:
                if(lastFigure && lastGender) loadAvatarInEditor(lastFigure, lastGender, false);
                resetCategories();
                showFeedback('Alterações desfeitas.');
                return;
            case AvatarEditorAction.ACTION_RANDOMIZE:
                const figure = generateRandomFigure(figureData, figureData.gender, GetClubMemberLevel(), figureSetIds, [ FigureData.FACE ]);

                loadAvatarInEditor(figure, figureData.gender, false);
                resetCategories();
                showFeedback('Visual aleatório aplicado.');
                return;
            case AvatarEditorAction.ACTION_SAVE:
                SendMessageComposer(new UserFigureComposer(figureData.gender, figureData.getFigureString()));
                addRecentLook(figureData.getFigureString(), figureData.gender);
                setLastFigure(figureData.getFigureString());
                setLastGender(figureData.gender);
                setIsVisible(false);
                return;
        }
    }, [ figureData, lastFigure, lastGender, figureSetIds, loadAvatarInEditor, resetCategories, addRecentLook, showFeedback ]);

    const closeEditor = useCallback(() =>
    {
        if(hasChanges && !window.confirm('Você tem alterações não salvas. Deseja fechar mesmo assim?')) return;

        setIsVisible(false);
    }, [ hasChanges ]);

    const setGender = useCallback((gender: string) =>
    {
        if(!figures) return;

        gender = AvatarEditorUtilities.getGender(gender);

        setFigureData(figures.get(gender));
        resetCategories();
        showFeedback('Gênero alterado.');
    }, [ figures, resetCategories, showFeedback ]);

    const renderLooksPanel = useCallback((looks: StoredAvatarLook[], emptyText: string, allowRemove: boolean = false) =>
    {
        return (
            <div className="avatar-editor-look-list">
                { looks.length === 0 &&
                    <div className="avatar-editor-look-empty">{ emptyText }</div> }

                { looks.map(look =>
                    <div key={ look.id } className="avatar-editor-look-card">
                        <div className="avatar-editor-look-card-info">
                            <b>{ look.name }</b>
                            <span>{ look.gender === FigureData.FEMALE ? 'Feminino' : 'Masculino' }</span>
                            <small>{ look.figure }</small>
                        </div>

                        <div className="avatar-editor-look-card-actions">
                            <button type="button" onClick={ () => applyLook(look) }>Aplicar</button>
                            { allowRemove && <button type="button" className="danger" onClick={ () => removeFavoriteLook(look) }>Remover</button> }
                        </div>
                    </div>
                ) }
            </div>
        );
    }, [ applyLook, removeFavoriteLook ]);

    useEffect(() =>
    {
        setFavoriteLooks(readStoredLooks(FAVORITE_LOOKS_STORAGE_KEY));
        setRecentLooks(readStoredLooks(RECENT_LOOKS_STORAGE_KEY));
    }, []);

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
                }
            },
            eventUrlPrefix: 'avatar-editor/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        setSavedFigures(new Array(maxWardrobeSlots));
    }, [ maxWardrobeSlots ]);

    useEffect(() =>
    {
        if(!isWardrobeVisible) return;

        setActiveCategory(null);
        setUtilityPanel('none');
        SendMessageComposer(new GetWardrobeMessageComposer());
    }, [ isWardrobeVisible ]);

    useEffect(() =>
    {
        if(!activeCategory) return;

        setIsWardrobeVisible(false);
    }, [ activeCategory ]);

    useEffect(() =>
    {
        if(!categories) return;

        selectCategory(AvatarEditorFigureCategory.GENERIC);
    }, [ categories, selectCategory ]);

    useEffect(() =>
    {
        if(!figureData) return;

        AvatarEditorUtilities.CURRENT_FIGURE = figureData;

        resetCategories();

        return () => AvatarEditorUtilities.CURRENT_FIGURE = null;
    }, [ figureData, resetCategories ]);

    useEffect(() =>
    {
        AvatarEditorUtilities.FIGURE_SET_IDS = figureSetIds;
        AvatarEditorUtilities.BOUND_FURNITURE_NAMES = boundFurnitureNames;

        resetCategories();

        return () =>
        {
            AvatarEditorUtilities.FIGURE_SET_IDS = null;
            AvatarEditorUtilities.BOUND_FURNITURE_NAMES = null;
        }
    }, [ figureSetIds, boundFurnitureNames, resetCategories ]);

    useEffect(() =>
    {
        if(!isVisible) return;

        if(!figures)
        {
            setupFigures();

            setIsInitalized(true);

            return;
        }
    }, [ isVisible, figures, setupFigures ]);

    useEffect(() =>
    {
        if(!isVisible || !isInitalized || !needsReset) return;

        loadAvatarInEditor(GetSessionDataManager().figure, GetSessionDataManager().gender);
        setNeedsReset(false);
    }, [ isVisible, isInitalized, needsReset, loadAvatarInEditor ]);

    useEffect(() =>
    {
        if(isVisible) return;

        return () =>
        {
            setNeedsReset(true);
            setUtilityPanel('none');
            setImportFigureText('');
        }
    }, [ isVisible ]);

    useEffect(() =>
    {
        if(!isVisible || !figureData) return;

        const onKeyDown = (event: KeyboardEvent) =>
        {
            const target = event.target as HTMLElement;
            const tagName = target?.tagName?.toLowerCase();
            const isTyping = (tagName === 'input') || (tagName === 'textarea') || (tagName === 'select');
            const key = event.key.toLowerCase();

            if(event.key === 'Escape' && !isTyping)
            {
                event.preventDefault();
                closeEditor();
                return;
            }

            if(event.ctrlKey && key === 's')
            {
                event.preventDefault();
                processAction(AvatarEditorAction.ACTION_SAVE);
                return;
            }

            if(event.ctrlKey && key === 'z' && !isTyping)
            {
                event.preventDefault();
                processAction(AvatarEditorAction.ACTION_RESET);
                return;
            }

            if(event.ctrlKey && key === 'r' && !isTyping)
            {
                event.preventDefault();
                processAction(AvatarEditorAction.ACTION_RANDOMIZE);
                return;
            }

            if(event.ctrlKey && key === 'c' && !isTyping)
            {
                event.preventDefault();
                copyCurrentFigure();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [ isVisible, figureData, processAction, closeEditor, copyCurrentFigure ]);

    if(!isVisible || !figureData) return null;

    return (
        <NitroCardView uniqueKey="avatar-editor" className={ `nitro-avatar-editor avatar-editor-improved avatar-editor-ux-plus ${ hasChanges ? 'has-changes' : '' }` }>
            <NitroCardHeaderView headerText={ LocalizeText('avatareditor.title') } onCloseClick={ closeEditor } />

            <div className="avatar-editor-tabs-wrapper">
                <NitroCardTabsView>
                    { categories && (categories.size > 0) && Array.from(categories.keys()).map(category =>
                    {
                        const isActive = (activeCategory && (activeCategory.name === category));

                        return (
                            <NitroCardTabsItemView key={ category } isActive={ isActive } onClick={ () => selectCategory(category) }>
                                { LocalizeText(`avatareditor.category.${ category }`) }
                            </NitroCardTabsItemView>
                        );
                    }) }
                    <NitroCardTabsItemView isActive={ isWardrobeVisible } onClick={ () => setIsWardrobeVisible(true) }>
                        { LocalizeText('avatareditor.category.wardrobe') }
                    </NitroCardTabsItemView>
                </NitroCardTabsView>
            </div>

            <NitroCardContentView className="avatar-editor-content" overflow="hidden">
                <div className="avatar-editor-toolbar">
                    <div className="avatar-editor-toolbar-info">
                        <div className="avatar-editor-toolbar-title">{ activeSectionName }</div>
                        <div className="avatar-editor-toolbar-subtitle">
                            { feedbackMessage || (hasChanges ? 'Você tem mudanças não salvas.' : 'Escolha uma peça, ajuste as cores e salve quando terminar.') }
                        </div>
                    </div>

                    <div className="avatar-editor-gender-switch">
                        <button type="button" className={ figureData.gender === FigureData.MALE ? 'active' : '' } onClick={ () => setGender(FigureData.MALE) }>
                            Masculino
                        </button>
                        <button type="button" className={ figureData.gender === FigureData.FEMALE ? 'active' : '' } onClick={ () => setGender(FigureData.FEMALE) }>
                            Feminino
                        </button>
                    </div>
                </div>

                <div className="avatar-editor-quickbar">
                    <button type="button" className={ utilityPanel === 'favorites' ? 'active' : '' } onClick={ () => setUtilityPanel(prev => prev === 'favorites' ? 'none' : 'favorites') }>
                        <FaStar /> Favoritos
                    </button>
                    <button type="button" className={ utilityPanel === 'recent' ? 'active' : '' } onClick={ () => setUtilityPanel(prev => prev === 'recent' ? 'none' : 'recent') }>
                        <FaHistory /> Recentes
                    </button>
                    <button type="button" className={ utilityPanel === 'presets' ? 'active' : '' } onClick={ () => setUtilityPanel(prev => prev === 'presets' ? 'none' : 'presets') }>
                        <FaClipboard /> Looks prontos
                    </button>
                    <button type="button" onClick={ copyCurrentFigure }>
                        <FaCopy /> Copiar visual
                    </button>
                    <button type="button" className={ utilityPanel === 'import' ? 'active' : '' } onClick={ () => setUtilityPanel(prev => prev === 'import' ? 'none' : 'import') }>
                        <FaPaste /> Colar visual
                    </button>
                    <button type="button" className={ isCurrentFavorite ? 'active favorite-active' : '' } onClick={ saveFavoriteLook }>
                        <FaStar /> { isCurrentFavorite ? 'Favoritado' : 'Favoritar atual' }
                    </button>
                </div>

                <div className="avatar-editor-main-layout">
                    <div className="avatar-editor-left-panel">
                        { utilityPanel !== 'none' &&
                            <div className="avatar-editor-utility-panel">
                                <div className="avatar-editor-utility-panel-header">
                                    <b>
                                        { utilityPanel === 'favorites' && 'Favoritos' }
                                        { utilityPanel === 'recent' && 'Recentes' }
                                        { utilityPanel === 'presets' && 'Looks prontos' }
                                        { utilityPanel === 'import' && 'Colar visual' }
                                    </b>

                                    <div>
                                        { utilityPanel === 'recent' && recentLooks.length > 0 &&
                                            <button type="button" onClick={ clearRecentLooks }>Limpar recentes</button> }
                                        <button type="button" onClick={ () => setUtilityPanel('none') }>Fechar</button>
                                    </div>
                                </div>

                                { utilityPanel === 'favorites' && renderLooksPanel(favoriteLooks, 'Nenhum visual favorito ainda. Use “Favoritar atual”.', true) }
                                { utilityPanel === 'recent' && renderLooksPanel(recentLooks, 'Nenhum visual recente ainda.') }
                                { utilityPanel === 'presets' && renderLooksPanel(PRESET_LOOKS, 'Nenhum look pronto disponível.') }
                                { utilityPanel === 'import' &&
                                    <div className="avatar-editor-import-box">
                                        <textarea
                                            value={ importFigureText }
                                            placeholder="Cole aqui um figure. Exemplo: hr-828-45.hd-180-1.ch-255-92.lg-275-82.sh-290-92"
                                            onChange={ event => setImportFigureText(event.target.value) }
                                        />

                                        <div className="avatar-editor-import-actions">
                                            <button type="button" onClick={ () => applyFigureFromText(importFigureText) }>Aplicar visual</button>
                                            <button type="button" onClick={ pasteFromClipboard }>Colar do clipboard</button>
                                        </div>

                                        <small>Para forçar gênero, use prefixo M: ou F: antes do visual.</small>
                                    </div> }
                            </div> }

                        <div className="avatar-editor-model-frame">
                            { (activeCategory && !isWardrobeVisible) &&
                                <AvatarEditorModelView model={ activeCategory } gender={ figureData.gender } setGender={ setGender } /> }
                            { isWardrobeVisible &&
                                <AvatarEditorWardrobeView figureData={ figureData } savedFigures={ savedFigures } setSavedFigures={ setSavedFigures } loadAvatarInEditor={ loadAvatarInEditor } /> }
                        </div>
                    </div>

                    <div className="avatar-editor-preview-panel">
                        <div className="avatar-editor-preview-header">
                            <span>Prévia</span>
                            { hasChanges && <b>Não salvo</b> }
                        </div>

                        <div className="avatar-editor-preview-stage">
                            <AvatarEditorFigurePreviewView figureData={ figureData } />
                        </div>

                        <div className="avatar-editor-preview-figure-string" title={ currentFigure }>
                            { currentFigure }
                        </div>

                        <div className="avatar-editor-preview-controls">
                            <ButtonGroup>
                                <Button variant="secondary" title="Desfazer alterações" onClick={ () => processAction(AvatarEditorAction.ACTION_RESET) }>
                                    <FaUndo className="fa-icon" />
                                </Button>
                                <Button variant="secondary" title="Limpar rosto" onClick={ () => processAction(AvatarEditorAction.ACTION_CLEAR) }>
                                    <FaTrash className="fa-icon" />
                                </Button>
                                <Button variant="secondary" title="Visual aleatório" onClick={ () => processAction(AvatarEditorAction.ACTION_RANDOMIZE) }>
                                    <FaDice className="fa-icon" />
                                </Button>
                            </ButtonGroup>

                            <Button className="avatar-editor-save-button w-100" variant="success" onClick={ () => processAction(AvatarEditorAction.ACTION_SAVE) }>
                                { hasChanges ? 'Salvar mudanças' : LocalizeText('avatareditor.save') }
                            </Button>
                        </div>

                        <div className="avatar-editor-shortcuts">
                            <span>Ctrl+S salva</span>
                           
                        </div>
                    </div>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
}
