import { FollowFriendMessageComposer, ILinkEventTracker } from '@nitrots/nitro-renderer';
import { FC, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { FaArchive, FaBell, FaBellSlash, FaChevronLeft, FaCog, FaFilter, FaForward, FaHome, FaImage, FaPalette, FaPaperPlane, FaSearch, FaShareAlt, FaSmile, FaThumbtack, FaTimes, FaUser, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { AddEventLinkTracker, GetSessionDataManager, GetUserProfile, LocalizeText, RemoveLinkEventTracker, ReportType, SendMessageComposer } from '../../../../api';
import { Base, Button, ButtonGroup, Column, Flex, Grid, LayoutAvatarImageView, LayoutBadgeImageView, LayoutGridItem, LayoutItemCountView, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../../../common';
import { useHelp, useMessenger } from '../../../../hooks';
import { FriendsMessengerThreadView, MessengerMessageActions, MessengerMessageMeta, MessengerSearchFilters } from './messenger-thread/FriendsMessengerThreadView';

type MessengerTheme = 'classic' | 'modern' | 'dark' | 'discord' | 'neon';
type Wallpaper = 'none' | 'pixels' | 'hotel' | 'stars' | 'dark-grid';

interface ReplyDraft
{
    key: string;
    author: string;
    message: string;
}

interface ForwardDraft
{
    key: string;
    author: string;
    message: string;
}

const EMOJIS = [ '😀', '😂', '😍', '😮', '😢', '😡', '👍', '👎', '❤️', '🔥', '🎉', '✨', '🤝', '👀', '🙏', '💎' ];
const STICKERS = [ '🎉', '💖', '🔥', '👏', '😎', '🤩', '🥳', '💯' ];
const QUICK_REACTIONS = [ '👍', '❤️', '😂', '😮', '😢' ];
const COMMANDS = [
    { command: '/perfil', description: 'Compartilhar seu perfil' },
    { command: '/quarto', description: 'Enviar convite para seu quarto' },
    { command: '/seguir', description: 'Seguir este amigo' },
    { command: '/limpar', description: 'Limpar o histórico local desta conversa' },
    { command: '/tema escuro', description: 'Ativar tema escuro' },
    { command: '/tema moderno', description: 'Ativar tema moderno' },
    { command: '/gif ', description: 'Enviar um GIF por URL' },
    { command: '/ajuda', description: 'Mostrar comandos disponíveis' }
];

const storageKey = (userId: number) => `nitro.messenger.enhancements.${ userId }`;

export const FriendsMessengerView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ lastThreadId, setLastThreadId ] = useState(-1);
    const [ messageText, setMessageText ] = useState('');
    const [ searchVisible, setSearchVisible ] = useState(false);
    const [ advancedSearchVisible, setAdvancedSearchVisible ] = useState(false);
    const [ searchText, setSearchText ] = useState('');
    const [ searchFilters, setSearchFilters ] = useState<MessengerSearchFilters>({ onlyLinks: false, onlyFavorites: false, onlyPinned: false, author: 'all' });
    const [ emojiVisible, setEmojiVisible ] = useState(false);
    const [ stickerVisible, setStickerVisible ] = useState(false);
    const [ themeMenuVisible, setThemeMenuVisible ] = useState(false);
    const [ settingsMenuVisible, setSettingsMenuVisible ] = useState(false);
    const [ shareMenuVisible, setShareMenuVisible ] = useState(false);
    const [ profilePanelVisible, setProfilePanelVisible ] = useState(false);
    const [ theme, setTheme ] = useState<MessengerTheme>('modern');
    const [ compactMode, setCompactMode ] = useState(false);
    const [ sendOnEnter, setSendOnEnter ] = useState(true);
    const [ notificationSound, setNotificationSound ] = useState(true);
    const [ fontScale, setFontScale ] = useState(100);
    const [ replyDraft, setReplyDraft ] = useState<ReplyDraft>(null);
    const [ forwardDraft, setForwardDraft ] = useState<ForwardDraft>(null);
    const [ messageMeta, setMessageMeta ] = useState<Record<string, MessengerMessageMeta>>({});
    const [ drafts, setDrafts ] = useState<Record<string, string>>({});
    const [ archivedThreadIds, setArchivedThreadIds ] = useState<number[]>([]);
    const [ mutedThreadIds, setMutedThreadIds ] = useState<number[]>([]);
    const [ showArchived, setShowArchived ] = useState(false);
    const [ wallpapers, setWallpapers ] = useState<Record<string, Wallpaper>>({});
    const [ clearedCounts, setClearedCounts ] = useState<Record<string, number>>({});
    const { visibleThreads = [], activeThread = null, getMessageThread = null, sendMessage = null, setActiveThreadId = null, closeThread = null } = useMessenger();
    const { report = null } = useHelp();
    const messagesBox = useRef<HTMLDivElement>();
    const inputRef = useRef<HTMLInputElement>();
    const currentUserId = GetSessionDataManager().userId;
    const currentUserName = GetSessionDataManager().userName;
    const activeThreadKey = activeThread ? activeThread.threadId.toString() : '';
    const activeWallpaper = wallpapers[activeThreadKey] || 'none';
    const isMuted = !!(activeThread && mutedThreadIds.includes(activeThread.threadId));
    const isArchived = !!(activeThread && archivedThreadIds.includes(activeThread.threadId));

    const followFriend = () => (activeThread && activeThread.participant && SendMessageComposer(new FollowFriendMessageComposer(activeThread.participant.id)));
    const openProfile = () => (activeThread && activeThread.participant && GetUserProfile(activeThread.participant.id));

    useEffect(() =>
    {
        try
        {
            const stored = window.localStorage.getItem(storageKey(currentUserId));
            if(!stored) return;
            const data = JSON.parse(stored);
            if(data.theme) setTheme(data.theme);
            if(data.messageMeta) setMessageMeta(data.messageMeta);
            if(data.drafts) setDrafts(data.drafts);
            if(data.archivedThreadIds) setArchivedThreadIds(data.archivedThreadIds);
            if(data.mutedThreadIds) setMutedThreadIds(data.mutedThreadIds);
            if(data.wallpapers) setWallpapers(data.wallpapers);
            if(data.clearedCounts) setClearedCounts(data.clearedCounts);
            if(typeof data.compactMode === 'boolean') setCompactMode(data.compactMode);
            if(typeof data.sendOnEnter === 'boolean') setSendOnEnter(data.sendOnEnter);
            if(typeof data.notificationSound === 'boolean') setNotificationSound(data.notificationSound);
            if(typeof data.fontScale === 'number') setFontScale(data.fontScale);
        }
        catch(error)
        {
            console.warn('Não foi possível carregar as preferências do mensageiro.', error);
        }
    }, [ currentUserId ]);

    useEffect(() =>
    {
        try
        {
            window.localStorage.setItem(storageKey(currentUserId), JSON.stringify({ theme, messageMeta, drafts, archivedThreadIds, mutedThreadIds, wallpapers, clearedCounts, compactMode, sendOnEnter, notificationSound, fontScale }));
        }
        catch(error)
        {
            console.warn('Não foi possível salvar as preferências do mensageiro.', error);
        }
    }, [ currentUserId, theme, messageMeta, drafts, archivedThreadIds, mutedThreadIds, wallpapers, clearedCounts, compactMode, sendOnEnter, notificationSound, fontScale ]);

    const updateMeta = (key: string, updater: (current: MessengerMessageMeta) => MessengerMessageMeta) =>
    {
        setMessageMeta(previous => ({ ...previous, [key]: updater(previous[key] || { reactions: {}, pinned: false, favorite: false }) }));
    };

    const messageActions: MessengerMessageActions = useMemo(() => ({
        onReply: (key, author, message) =>
        {
            setReplyDraft({ key, author, message });
            inputRef.current && inputRef.current.focus();
        },
        onReact: (key, emoji) => updateMeta(key, current =>
        {
            const reactions = { ...current.reactions };
            reactions[emoji] = (reactions[emoji] || 0) + 1;
            return { ...current, reactions };
        }),
        onPin: key => updateMeta(key, current => ({ ...current, pinned: !current.pinned })),
        onFavorite: key => updateMeta(key, current => ({ ...current, favorite: !current.favorite })),
        onForward: (key, author, message) => setForwardDraft({ key, author, message }),
        onCopy: message =>
        {
            if(navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(message);
            else
            {
                const textarea = document.createElement('textarea');
                textarea.value = message;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
            }
        }
    }), []);

    const setComposerText = (value: string) =>
    {
        const limited = value.substring(0, 255);
        setMessageText(limited);
        if(activeThreadKey) setDrafts(previous => ({ ...previous, [activeThreadKey]: limited }));
    };

    const totalThreadChats = () => activeThread ? activeThread.groups.reduce((total, group) => total + group.chats.length, 0) : 0;

    const executeCommand = (text: string): boolean =>
    {
        if(!activeThread || !text.startsWith('/')) return false;
        const normalized = text.trim();

        if(normalized === '/perfil')
        {
            sendMessage(activeThread, currentUserId, `[PERFIL] ${ currentUserName }|${ currentUserId }`);
            return true;
        }
        if(normalized === '/quarto')
        {
            sendMessage(activeThread, currentUserId, '[QUARTO] Venha me encontrar no hotel! Use o botão Seguir para entrar no meu quarto.');
            return true;
        }
        if(normalized === '/seguir')
        {
            followFriend();
            return true;
        }
        if(normalized === '/limpar')
        {
            setClearedCounts(previous => ({ ...previous, [activeThreadKey]: totalThreadChats() }));
            return true;
        }
        if(normalized === '/tema escuro')
        {
            setTheme('dark');
            return true;
        }
        if(normalized === '/tema moderno')
        {
            setTheme('modern');
            return true;
        }
        if(normalized.startsWith('/gif '))
        {
            const url = normalized.substring(5).trim();
            if(/^https?:\/\//i.test(url)) sendMessage(activeThread, currentUserId, `[GIF] ${ url }`.substring(0, 255));
            return true;
        }
        if(normalized === '/ajuda')
        {
            window.alert(COMMANDS.map(item => `${ item.command } — ${ item.description }`).join('\n'));
            return true;
        }

        return false;
    };

    const send = () =>
    {
        const cleanMessage = messageText.trim();
        if(!activeThread || !cleanMessage.length) return;

        if(executeCommand(cleanMessage))
        {
            setComposerText('');
            setReplyDraft(null);
            return;
        }

        const safeAuthor = replyDraft ? replyDraft.author.replace(/[|\]]/g, '') : '';
        const safeExcerpt = replyDraft ? replyDraft.message.replace(/[|\]\r\n]/g, ' ').substring(0, 55) : '';
        const finalMessage = replyDraft ? `[[R|${ safeAuthor }|${ safeExcerpt }]] ${ cleanMessage }` : cleanMessage;

        sendMessage(activeThread, currentUserId, finalMessage.substring(0, 255));
        setComposerText('');
        setReplyDraft(null);
        setEmojiVisible(false);
        setStickerVisible(false);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) =>
    {
        if(event.key === 'Enter' && !event.shiftKey && sendOnEnter)
        {
            event.preventDefault();
            send();
        }
        if(event.key === 'Escape')
        {
            setReplyDraft(null);
            setEmojiVisible(false);
            setStickerVisible(false);
            setThemeMenuVisible(false);
            setSettingsMenuVisible(false);
            setShareMenuVisible(false);
        }
    };

    const appendText = (value: string) =>
    {
        setComposerText(`${ messageText }${ value }`);
        inputRef.current && inputRef.current.focus();
    };

    const insertGif = () =>
    {
        const url = window.prompt('Cole a URL direta do GIF:');
        if(!url) return;
        if(!/^https?:\/\//i.test(url)) return window.alert('Use uma URL válida iniciada por http:// ou https://.');
        appendText(`/gif ${ url }`);
    };

    const toggleArchive = () =>
    {
        if(!activeThread) return;
        setArchivedThreadIds(previous => previous.includes(activeThread.threadId) ? previous.filter(id => id !== activeThread.threadId) : [ ...previous, activeThread.threadId ]);
    };

    const toggleMute = () =>
    {
        if(!activeThread) return;
        setMutedThreadIds(previous => previous.includes(activeThread.threadId) ? previous.filter(id => id !== activeThread.threadId) : [ ...previous, activeThread.threadId ]);
    };

    const forwardToThread = (thread: any) =>
    {
        if(!forwardDraft) return;
        const author = forwardDraft.author.replace(/[|\]]/g, '');
        sendMessage(thread, currentUserId, `[[F|${ author }]] ${ forwardDraft.message }`.substring(0, 255));
        setForwardDraft(null);
    };

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length !== 2) return;
                if(parts[1] === 'open') return setIsVisible(true);
                if(parts[1] === 'toggle') return setIsVisible(previous => !previous);
                const thread = getMessageThread(parseInt(parts[1]));
                if(!thread) return;
                setActiveThreadId(thread.threadId);
                setIsVisible(true);
            },
            eventUrlPrefix: 'friends-messenger/'
        };
        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, [ getMessageThread, setActiveThreadId ]);

    useEffect(() =>
    {
        if(!isVisible || !activeThread || searchText) return;
        if(messagesBox.current) messagesBox.current.scrollTop = messagesBox.current.scrollHeight;
    }, [ isVisible, activeThread, searchText ]);

    useEffect(() =>
    {
        setReplyDraft(null);
        setSearchText('');
        setEmojiVisible(false);
        setStickerVisible(false);
        setProfilePanelVisible(false);
        setMessageText(activeThreadKey ? (drafts[activeThreadKey] || '') : '');
    }, [ activeThreadKey ]);

    useEffect(() =>
    {
        if(isVisible && !activeThread)
        {
            if(lastThreadId > 0) setActiveThreadId(lastThreadId);
            else if(visibleThreads.length > 0) setActiveThreadId(visibleThreads[0].threadId);
            return;
        }
        if(!isVisible && activeThread)
        {
            setLastThreadId(activeThread.threadId);
            setActiveThreadId(-1);
        }
    }, [ isVisible, activeThread, lastThreadId, visibleThreads, setActiveThreadId ]);

    const pinnedItems = useMemo(() => Object.keys(messageMeta).filter(key => messageMeta[key] && messageMeta[key].pinned), [ messageMeta ]);
    const filteredThreads = useMemo(() => visibleThreads.filter(thread => showArchived ? archivedThreadIds.includes(thread.threadId) : !archivedThreadIds.includes(thread.threadId)), [ visibleThreads, showArchived, archivedThreadIds ]);
    const commandMatches = useMemo(() => messageText.startsWith('/') ? COMMANDS.filter(item => item.command.startsWith(messageText.toLowerCase()) || item.command.includes(messageText.toLowerCase())).slice(0, 6) : [], [ messageText ]);

    if(!isVisible) return null;

    return (
        <NitroCardView className={ `nitro-friends-messenger messenger-theme-${ theme } messenger-wallpaper-${ activeWallpaper } ${ compactMode ? 'messenger-compact' : '' } ${ profilePanelVisible ? 'profile-panel-open' : '' }` } style={ { '--messenger-font-scale': `${ fontScale / 100 }` } as any } uniqueKey="nitro-friends-messenger" theme="primary-slim">
            <NitroCardHeaderView headerText={ LocalizeText('messenger.window.title', [ 'OPEN_CHAT_COUNT' ], [ visibleThreads.length.toString() ]) } onCloseClick={ () => setIsVisible(false) } />
            <NitroCardContentView>
                <Grid overflow="hidden" className="messenger-layout">
                    <Column size={ 4 } overflow="hidden" className="messenger-sidebar">
                        <Flex alignItems="center" justifyContent="between" className="messenger-sidebar-heading">
                            <Text bold>{ showArchived ? 'Conversas arquivadas' : LocalizeText('toolbar.icon.label.messenger') }</Text>
                            <button type="button" className={ `messenger-mini-toggle ${ showArchived ? 'active' : '' }` } title="Ver arquivadas" onClick={ () => setShowArchived(value => !value) }><FaArchive /></button>
                        </Flex>
                        <Column fit overflow="auto" className="messenger-thread-list">
                            { filteredThreads.map(thread => (
                                <LayoutGridItem key={ thread.threadId } itemActive={ activeThread === thread } onClick={ () => setActiveThreadId(thread.threadId) }>
                                    { thread.unread && <LayoutItemCountView count={ thread.unreadCount } /> }
                                    <Flex fullWidth alignItems="center" gap={ 1 }>
                                        <Flex alignItems="center" className="friend-head px-1">
                                            { thread.participant.id > 0 && <LayoutAvatarImageView figure={ thread.participant.figure } headOnly direction={ 3 } /> }
                                            { thread.participant.id <= 0 && <LayoutBadgeImageView isGroup badgeCode={ thread.participant.figure } /> }
                                        </Flex>
                                        <Column gap={ 0 } grow overflow="hidden">
                                            <Text truncate bold>{ thread.participant.name }</Text>
                                            <Text truncate small className="messenger-thread-preview">{ drafts[thread.threadId.toString()] ? `Rascunho: ${ drafts[thread.threadId.toString()] }` : (mutedThreadIds.includes(thread.threadId) ? 'Conversa silenciada' : 'Clique para conversar') }</Text>
                                        </Column>
                                    </Flex>
                                </LayoutGridItem>
                            )) }
                            { filteredThreads.length === 0 && <div className="messenger-empty-state">Nenhuma conversa nesta seção.</div> }
                        </Column>
                    </Column>

                    <Column size={ profilePanelVisible ? 6 : 8 } overflow="hidden" className="messenger-conversation">
                        { activeThread && <>
                            <Flex alignItems="center" justifyContent="between" gap={ 1 } className="messenger-conversation-header">
                                <Flex alignItems="center" gap={ 2 } onClick={ () => setProfilePanelVisible(true) } className="messenger-profile-trigger">
                                    <div className="messenger-header-avatar">{ activeThread.participant.id > 0 ? <LayoutAvatarImageView figure={ activeThread.participant.figure } headOnly direction={ 3 } /> : <LayoutBadgeImageView isGroup badgeCode={ activeThread.participant.figure } /> }</div>
                                    <Column gap={ 0 }><Text bold>{ activeThread.participant.name }</Text><Text small className="messenger-presence">Conversa privada</Text></Column>
                                </Flex>
                                <Flex gap={ 1 } className="messenger-header-actions">
                                    <button className={ `messenger-icon-button ${ searchVisible ? 'active' : '' }` } title="Pesquisar mensagens" onClick={ () => setSearchVisible(value => !value) }><FaSearch /></button>
                                    <button className={ `messenger-icon-button ${ isMuted ? 'active' : '' }` } title={ isMuted ? 'Ativar notificações' : 'Silenciar conversa' } onClick={ toggleMute }>{ isMuted ? <FaVolumeMute /> : <FaVolumeUp /> }</button>
                                    <button className={ `messenger-icon-button ${ isArchived ? 'active' : '' }` } title={ isArchived ? 'Desarquivar' : 'Arquivar conversa' } onClick={ toggleArchive }><FaArchive /></button>
                                    <div className="messenger-dropdown-wrap">
                                        <button className="messenger-icon-button" title="Compartilhar" onClick={ () => setShareMenuVisible(value => !value) }><FaShareAlt /></button>
                                        { shareMenuVisible && <div className="messenger-theme-menu messenger-share-menu"><button onClick={ () => { setComposerText('/perfil'); setShareMenuVisible(false); } }><FaUser /> Compartilhar perfil</button><button onClick={ () => { setComposerText('/quarto'); setShareMenuVisible(false); } }><FaHome /> Compartilhar quarto</button></div> }
                                    </div>
                                    <div className="messenger-dropdown-wrap">
                                        <button className="messenger-icon-button" title="Aparência" onClick={ () => setThemeMenuVisible(value => !value) }><FaPalette /></button>
                                        { themeMenuVisible && <div className="messenger-theme-menu"><strong>Tema</strong>{ ([ 'classic', 'modern', 'dark', 'discord', 'neon' ] as MessengerTheme[]).map(item => <button key={ item } className={ theme === item ? 'active' : '' } onClick={ () => setTheme(item) }>{ item }</button>) }<strong>Papel de parede</strong>{ ([ 'none', 'pixels', 'hotel', 'stars', 'dark-grid' ] as Wallpaper[]).map(item => <button key={ item } className={ activeWallpaper === item ? 'active' : '' } onClick={ () => setWallpapers(previous => ({ ...previous, [activeThreadKey]: item })) }>{ item }</button>) }</div> }
                                    </div>
                                    <div className="messenger-dropdown-wrap">
                                        <button className={ `messenger-icon-button ${ settingsMenuVisible ? 'active' : '' }` } title="Configurações" onClick={ () => setSettingsMenuVisible(value => !value) }><FaCog /></button>
                                        { settingsMenuVisible && <div className="messenger-settings-menu"><label><span>Modo compacto</span><input type="checkbox" checked={ compactMode } onChange={ event => setCompactMode(event.target.checked) } /></label><label><span>Enter envia</span><input type="checkbox" checked={ sendOnEnter } onChange={ event => setSendOnEnter(event.target.checked) } /></label><label><span>Som de notificação</span><button type="button" className={ notificationSound ? 'enabled' : '' } onClick={ () => setNotificationSound(value => !value) }>{ notificationSound ? <FaBell /> : <FaBellSlash /> }</button></label><div className="messenger-font-control"><span>Tamanho do texto</span><div><button type="button" onClick={ () => setFontScale(value => Math.max(85, value - 5)) }>A−</button><strong>{ fontScale }%</strong><button type="button" onClick={ () => setFontScale(value => Math.min(130, value + 5)) }>A+</button></div></div></div> }
                                    </div>
                                    <ButtonGroup><Button onClick={ followFriend }><Base className="nitro-friends-spritesheet icon-follow" /></Button><Button onClick={ openProfile }><Base className="nitro-friends-spritesheet icon-profile-sm" /></Button></ButtonGroup>
                                    <Button variant="danger" onClick={ () => report(ReportType.IM, { reportedUserId: activeThread.participant.id }) }>{ LocalizeText('messenger.window.button.report') }</Button>
                                    <button className="messenger-icon-button" title="Fechar conversa" onClick={ () => closeThread(activeThread.threadId) }><FaTimes /></button>
                                </Flex>
                            </Flex>

                            { searchVisible && <div className="messenger-search-wrap"><div className="messenger-search-bar"><FaSearch /><input autoFocus value={ searchText } onChange={ event => setSearchText(event.target.value) } placeholder="Pesquisar nesta conversa..." /><button className={ advancedSearchVisible ? 'active' : '' } onClick={ () => setAdvancedSearchVisible(value => !value) }><FaFilter /></button>{ searchText && <button onClick={ () => setSearchText('') }><FaTimes /></button> }</div>{ advancedSearchVisible && <div className="messenger-advanced-search"><label><input type="checkbox" checked={ searchFilters.onlyLinks } onChange={ e => setSearchFilters(value => ({ ...value, onlyLinks: e.target.checked })) } /> Somente links</label><label><input type="checkbox" checked={ searchFilters.onlyFavorites } onChange={ e => setSearchFilters(value => ({ ...value, onlyFavorites: e.target.checked })) } /> Favoritas</label><label><input type="checkbox" checked={ searchFilters.onlyPinned } onChange={ e => setSearchFilters(value => ({ ...value, onlyPinned: e.target.checked })) } /> Fixadas</label><select value={ searchFilters.author } onChange={ e => setSearchFilters(value => ({ ...value, author: e.target.value as any })) }><option value="all">Todos</option><option value="mine">Minhas mensagens</option><option value="other">Do amigo</option></select></div> }</div> }
                            { pinnedItems.length > 0 && <div className="messenger-pinned-banner"><FaThumbtack /> { pinnedItems.length } mensagem(ns) fixada(s) neste navegador</div> }

                            <Column fit className="chat-messages"><Column innerRef={ messagesBox } overflow="auto" className="messenger-message-scroll"><FriendsMessengerThreadView thread={ activeThread } searchText={ searchText } searchFilters={ searchFilters } messageMeta={ messageMeta } actions={ messageActions } quickReactions={ QUICK_REACTIONS } unreadCount={ activeThread.unreadCount || 0 } clearedCount={ clearedCounts[activeThreadKey] || 0 } /></Column></Column>

                            { replyDraft && <div className="messenger-reply-preview"><div><strong>Respondendo a { replyDraft.author }</strong><span>{ replyDraft.message }</span></div><button onClick={ () => setReplyDraft(null) }><FaTimes /></button></div> }
                            <div className="messenger-composer">
                                <div className="messenger-composer-toolbar"><button title="Emojis" className={ emojiVisible ? 'active' : '' } onClick={ () => { setEmojiVisible(value => !value); setStickerVisible(false); } }><FaSmile /></button><button title="Stickers" className={ stickerVisible ? 'active' : '' } onClick={ () => { setStickerVisible(value => !value); setEmojiVisible(false); } }>🎟️</button><button title="Inserir GIF por URL" onClick={ insertGif }><FaImage /></button><button title="Negrito" onClick={ () => appendText('**texto**') }><strong>B</strong></button><button title="Itálico" onClick={ () => appendText('*texto*') }><em>I</em></button><button title="Menção" onClick={ () => appendText(`@${ activeThread.participant.name } `) }>@</button></div>
                                { emojiVisible && <div className="messenger-picker">{ EMOJIS.map(emoji => <button key={ emoji } onClick={ () => appendText(emoji) }>{ emoji }</button>) }</div> }
                                { stickerVisible && <div className="messenger-picker messenger-sticker-picker">{ STICKERS.map(sticker => <button key={ sticker } onClick={ () => appendText(`${ sticker } `) }>{ sticker }</button>) }</div> }
                                { commandMatches.length > 0 && <div className="messenger-command-menu">{ commandMatches.map(item => <button key={ item.command } onClick={ () => setComposerText(item.command) }><strong>{ item.command }</strong><span>{ item.description }</span></button>) }</div> }
                                <Flex gap={ 1 } className="messenger-input-row"><input ref={ inputRef } type="text" className="form-control form-control-sm messenger-input" maxLength={ 255 } placeholder={ LocalizeText('messenger.window.input.default', [ 'FRIEND_NAME' ], [ activeThread.participant.name ]) } value={ messageText } onChange={ event => setComposerText(event.target.value) } onKeyDown={ onKeyDown } /><span className="messenger-character-count">{ messageText.length }/255</span><button className="messenger-send-button" disabled={ !messageText.trim() } onClick={ send }><FaPaperPlane /></button></Flex>
                            </div>
                        </> }
                    </Column>

                    { profilePanelVisible && activeThread && <Column size={ 2 } className="messenger-profile-panel"><button className="messenger-profile-close" onClick={ () => setProfilePanelVisible(false) }><FaChevronLeft /></button><div className="messenger-profile-avatar"><LayoutAvatarImageView figure={ activeThread.participant.figure } direction={ 2 } /></div><h4>{ activeThread.participant.name }</h4><span>ID: { activeThread.participant.id }</span><button onClick={ openProfile }><FaUser /> Abrir perfil</button><button onClick={ followFriend }><FaHome /> Seguir usuário</button><button onClick={ () => setComposerText('/perfil') }><FaShareAlt /> Compartilhar perfil</button><button onClick={ toggleMute }>{ isMuted ? <FaVolumeUp /> : <FaVolumeMute /> } { isMuted ? 'Ativar conversa' : 'Silenciar conversa' }</button><button onClick={ toggleArchive }><FaArchive /> { isArchived ? 'Desarquivar' : 'Arquivar' }</button></Column> }
                </Grid>
            </NitroCardContentView>

            { forwardDraft && <div className="messenger-modal-backdrop"><div className="messenger-forward-modal"><div className="messenger-modal-header"><strong><FaForward /> Encaminhar mensagem</strong><button onClick={ () => setForwardDraft(null) }><FaTimes /></button></div><p>Escolha uma conversa:</p><div className="messenger-forward-list">{ visibleThreads.filter(thread => !archivedThreadIds.includes(thread.threadId)).map(thread => <button key={ thread.threadId } onClick={ () => forwardToThread(thread) }><div className="friend-head">{ thread.participant.id > 0 ? <LayoutAvatarImageView figure={ thread.participant.figure } headOnly direction={ 3 } /> : <LayoutBadgeImageView isGroup badgeCode={ thread.participant.figure } /> }</div><span>{ thread.participant.name }</span></button>) }</div></div></div> }
        </NitroCardView>
    );
};
