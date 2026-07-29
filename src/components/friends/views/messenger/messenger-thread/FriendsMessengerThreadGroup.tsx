import { FC, ReactNode, useMemo } from 'react';
import { FaCopy, FaExternalLinkAlt, FaForward, FaHome, FaReply, FaStar, FaThumbtack, FaUser } from 'react-icons/fa';
import { GetGroupChatData, GetSessionDataManager, GetUserProfile, LocalizeText, MessengerGroupType, MessengerThread, MessengerThreadChat, MessengerThreadChatGroup } from '../../../../../api';
import { Base, Flex, LayoutAvatarImageView } from '../../../../../common';
import { MessengerMessageActions, MessengerMessageMeta, MessengerSearchFilters } from './FriendsMessengerThreadView';

interface FriendsMessengerThreadGroupProps
{
    thread: MessengerThread;
    group: MessengerThreadChatGroup;
    groupIndex: number;
    groupStartIndex: number;
    unreadStartIndex: number;
    clearedCount: number;
    searchText?: string;
    searchFilters?: MessengerSearchFilters;
    messageMeta?: Record<string, MessengerMessageMeta>;
    actions?: MessengerMessageActions;
    quickReactions?: string[];
}

interface ReplyContent
{
    author: string;
    excerpt: string;
    body: string;
}

const parseReply = (message: string): ReplyContent | null =>
{
    const match = message.match(/^\[\[R\|([^|\]]+)\|([^\]]*)\]\]\s*([\s\S]*)$/);

    if(match) return { author: match[1], excerpt: match[2], body: match[3] };

    const legacy = message.match(/^↩\s+@([^:]+):\s+“([^”]+)”\s*\n?([\s\S]*)$/);

    if(legacy) return { author: legacy[1], excerpt: legacy[2], body: legacy[3] };

    return null;
};

const renderRichText = (message: string, currentUserName: string): ReactNode[] =>
{
    const pattern = /(https?:\/\/[^\s]+|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|@[A-Za-z0-9_\-.]+)/g;
    const parts = message.split(pattern);

    return parts.map((part, index) =>
    {
        if(/^https?:\/\//i.test(part))
        {
            const isGif = /\.(gif)(\?.*)?$/i.test(part);
            if(isGif) return <img key={ index } src={ part } className="messenger-inline-gif" alt="GIF enviado na conversa" loading="lazy" />;
            return <a key={ index } href={ part } target="_blank" rel="noreferrer">{ part }</a>;
        }

        if(part.startsWith('**') && part.endsWith('**')) return <strong key={ index }>{ part.slice(2, -2) }</strong>;
        if(part.startsWith('*') && part.endsWith('*')) return <em key={ index }>{ part.slice(1, -1) }</em>;
        if(part.startsWith('`') && part.endsWith('`')) return <code key={ index }>{ part.slice(1, -1) }</code>;
        if(part.startsWith('@')) return <span key={ index } className={ `messenger-mention ${ part.substring(1).toLowerCase() === currentUserName.toLowerCase() ? 'is-me' : '' }` }>{ part }</span>;

        return <span key={ index }>{ part }</span>;
    });
};

const scrollToOriginal = (excerpt: string) =>
{
    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-message-plain]'));
    const normalized = excerpt.trim().toLowerCase();
    const target = rows.find(row => (row.dataset.messagePlain || '').toLowerCase().includes(normalized));

    if(!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('messenger-message-flash');
    window.setTimeout(() => target.classList.remove('messenger-message-flash'), 1600);
};

export const FriendsMessengerThreadGroup: FC<FriendsMessengerThreadGroupProps> = props =>
{
    const {
        thread = null,
        group = null,
        groupIndex = 0,
        groupStartIndex = 0,
        unreadStartIndex = Number.MAX_SAFE_INTEGER,
        clearedCount = 0,
        searchText = '',
        searchFilters = { onlyLinks: false, onlyFavorites: false, onlyPinned: false, author: 'all' },
        messageMeta = {},
        actions = null,
        quickReactions = []
    } = props;

    const groupChatData = useMemo(() => ((group && group.type === MessengerGroupType.GROUP_CHAT) && GetGroupChatData(group.chats[0].extraData)), [ group ]);

    const isOwnChat = useMemo(() =>
    {
        if(!thread || !group) return false;
        if(group.type === MessengerGroupType.PRIVATE_CHAT && group.userId === GetSessionDataManager().userId) return true;
        if(groupChatData && group.chats.length && groupChatData.userId === GetSessionDataManager().userId) return true;
        return false;
    }, [ thread, group, groupChatData ]);

    if(!thread || !group) return null;

    if(!group.userId)
    {
        return <>{ group.chats.map((chat, index) =>
        {
            if((groupStartIndex + index) < clearedCount) return null;

            return (
                <Flex key={ index } fullWidth gap={ 2 } justifyContent="start">
                    <Base className="w-100 text-break">
                        { chat.type === MessengerThreadChat.SECURITY_NOTIFICATION && <Flex gap={ 2 } alignItems="center" className="messenger-system-message warning"><Base className="nitro-friends-spritesheet icon-warning flex-shrink-0" /><Base>{ chat.message }</Base></Flex> }
                        { chat.type === MessengerThreadChat.ROOM_INVITE && <Flex gap={ 2 } alignItems="center" className="messenger-system-message invite"><Base className="messenger-notification-icon flex-shrink-0" /><Base>{ LocalizeText('messenger.invitation') + ' ' }{ chat.message }</Base></Flex> }
                    </Base>
                </Flex>
            );
        }) }</>;
    }

    const author = isOwnChat ? GetSessionDataManager().userName : (groupChatData ? groupChatData.username : thread.participant.name);
    const figure = isOwnChat ? GetSessionDataManager().figure : (groupChatData ? groupChatData.figure : thread.participant.figure);
    const normalizedSearch = searchText.trim().toLowerCase();

    return (
        <div className={ `messenger-message-group ${ isOwnChat ? 'is-own' : 'is-other' }` }>
            <div className="message-avatar"><LayoutAvatarImageView figure={ figure } direction={ isOwnChat ? 4 : 2 } /></div>
            <div className="messenger-group-content">
                <div className="messenger-author-row"><strong>{ author }</strong><span>agora</span></div>
                { group.chats.map((chat, chatIndex) =>
                {
                    const absoluteIndex = groupStartIndex + chatIndex;

                    if(absoluteIndex < clearedCount) return null;

                    const messageKey = `${ thread.threadId }:${ groupIndex }:${ chatIndex }:${ chat.message }`;
                    const meta = messageMeta[messageKey] || { reactions: {}, pinned: false, favorite: false };
                    const reply = parseReply(chat.message);
                    const visibleBody = reply ? reply.body : chat.message;
                    const hasLink = /https?:\/\//i.test(visibleBody);
                    const matchesText = !normalizedSearch || chat.message.toLowerCase().includes(normalizedSearch);
                    const matchesAuthor = searchFilters.author === 'all' || (searchFilters.author === 'mine' ? isOwnChat : !isOwnChat);
                    const matches = matchesText && matchesAuthor && (!searchFilters.onlyLinks || hasLink) && (!searchFilters.onlyFavorites || meta.favorite) && (!searchFilters.onlyPinned || meta.pinned);

                    if(!matches) return null;

                    const profileMatch = visibleBody.match(/^\[PERFIL\]\s*([^|]+)\|(\d+)$/);
                    const roomMatch = visibleBody.match(/^\[QUARTO\]\s*(.+)$/);
                    const forwardedMatch = visibleBody.match(/^\[\[F\|([^\]]+)\]\]\s*([\s\S]*)$/);
                    const displayText = forwardedMatch ? forwardedMatch[2] : visibleBody;

                    return (
                        <div key={ messageKey }>
                            { absoluteIndex === unreadStartIndex && unreadStartIndex > 0 && <div className="messenger-unread-separator"><span>Novas mensagens</span></div> }
                            <div id={ `messenger-message-${ encodeURIComponent(messageKey) }` } data-message-plain={ displayText } className={ `messenger-message-row ${ meta.pinned ? 'is-pinned' : '' } ${ meta.favorite ? 'is-favorite' : '' }` }>
                                <div className="messenger-message-bubble text-break">
                                    { meta.pinned && <span className="messenger-meta-badge"><FaThumbtack /> Fixada</span> }
                                    { meta.favorite && <span className="messenger-meta-badge"><FaStar /> Favorita</span> }
                                    { forwardedMatch && <div className="messenger-forwarded-label"><FaForward /> Encaminhada de { forwardedMatch[1] }</div> }
                                    { reply && <button type="button" className="messenger-inline-reply" onClick={ () => scrollToOriginal(reply.excerpt) }><strong>{ reply.author }</strong><span>{ reply.excerpt }</span></button> }
                                    { profileMatch
                                        ? <button type="button" className="messenger-share-card" onClick={ () => GetUserProfile(parseInt(profileMatch[2])) }><FaUser /><span><strong>Perfil de { profileMatch[1] }</strong><small>Clique para visualizar</small></span><FaExternalLinkAlt /></button>
                                        : roomMatch
                                            ? <div className="messenger-share-card room-card"><FaHome /><span><strong>Convite para quarto</strong><small>{ roomMatch[1] }</small></span></div>
                                            : <div className="messenger-message-text">{ renderRichText(displayText, GetSessionDataManager().userName) }</div> }
                                    { Object.keys(meta.reactions).length > 0 && <div className="messenger-reaction-list">{ Object.keys(meta.reactions).map(emoji => <button key={ emoji } onClick={ () => actions && actions.onReact(messageKey, emoji) }>{ emoji } <span>{ meta.reactions[emoji] }</span></button>) }</div> }
                                </div>

                                <div className="messenger-message-actions">
                                    <button title="Responder" onClick={ () => actions && actions.onReply(messageKey, author, displayText) }><FaReply /></button>
                                    <div className="messenger-reaction-menu">{ quickReactions.map(emoji => <button key={ emoji } onClick={ () => actions && actions.onReact(messageKey, emoji) }>{ emoji }</button>) }</div>
                                    <button title="Encaminhar" onClick={ () => actions && actions.onForward(messageKey, author, displayText) }><FaForward /></button>
                                    <button title="Copiar" onClick={ () => actions && actions.onCopy(displayText) }><FaCopy /></button>
                                    <button className={ meta.favorite ? 'active' : '' } title="Favoritar" onClick={ () => actions && actions.onFavorite(messageKey) }><FaStar /></button>
                                    <button className={ meta.pinned ? 'active' : '' } title="Fixar" onClick={ () => actions && actions.onPin(messageKey) }><FaThumbtack /></button>
                                </div>
                            </div>
                        </div>
                    );
                }) }
            </div>
        </div>
    );
};
