import { FC, useMemo } from 'react';
import { MessengerThread } from '../../../../../api';
import { FriendsMessengerThreadGroup } from './FriendsMessengerThreadGroup';

export interface MessengerMessageMeta
{
    reactions: Record<string, number>;
    pinned: boolean;
    favorite: boolean;
}

export interface MessengerSearchFilters
{
    onlyLinks: boolean;
    onlyFavorites: boolean;
    onlyPinned: boolean;
    author: 'all' | 'mine' | 'other';
}

export interface MessengerMessageActions
{
    onReply: (key: string, author: string, message: string) => void;
    onReact: (key: string, emoji: string) => void;
    onPin: (key: string) => void;
    onFavorite: (key: string) => void;
    onCopy: (message: string) => void;
    onForward: (key: string, author: string, message: string) => void;
}

interface FriendsMessengerThreadViewProps
{
    thread: MessengerThread;
    searchText?: string;
    searchFilters?: MessengerSearchFilters;
    messageMeta?: Record<string, MessengerMessageMeta>;
    actions?: MessengerMessageActions;
    quickReactions?: string[];
    unreadCount?: number;
    clearedCount?: number;
}

export const FriendsMessengerThreadView: FC<FriendsMessengerThreadViewProps> = props =>
{
    const {
        thread = null,
        searchText = '',
        searchFilters = { onlyLinks: false, onlyFavorites: false, onlyPinned: false, author: 'all' },
        messageMeta = {},
        actions = null,
        quickReactions = [],
        unreadCount = 0,
        clearedCount = 0
    } = props;

    const totalChats = useMemo(() =>
    {
        if(!thread) return 0;

        return thread.groups.reduce((total, group) => total + group.chats.length, 0);
    }, [ thread ]);

    if(!thread) return null;

    thread.setRead();

    const unreadStartIndex = Math.max(clearedCount, totalChats - Math.max(0, unreadCount));
    let runningIndex = 0;

    return (
        <>
            { thread.groups.length > 0 && thread.groups.map((group, index) =>
            {
                const groupStartIndex = runningIndex;
                runningIndex += group.chats.length;

                return (
                    <FriendsMessengerThreadGroup
                        key={ index }
                        thread={ thread }
                        group={ group }
                        groupIndex={ index }
                        groupStartIndex={ groupStartIndex }
                        unreadStartIndex={ unreadStartIndex }
                        clearedCount={ clearedCount }
                        searchText={ searchText }
                        searchFilters={ searchFilters }
                        messageMeta={ messageMeta }
                        actions={ actions }
                        quickReactions={ quickReactions }
                    />
                );
            }) }
        </>
    );
};
