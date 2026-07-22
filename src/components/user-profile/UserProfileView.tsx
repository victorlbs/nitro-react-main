import { ExtendedProfileChangedMessageEvent, RelationshipStatusInfoEvent, RelationshipStatusInfoMessageParser, RoomEngineObjectEvent, RoomObjectCategory, RoomObjectType, UserCurrentBadgesComposer, UserCurrentBadgesEvent, UserProfileEvent, UserProfileParser, UserRelationshipsComposer } from '@nitrots/nitro-renderer';
import { FC, useRef, useState } from 'react';
import { CreateLinkEvent, GetRoomSession, GetSessionDataManager, GetUserProfile, LocalizeText, SendMessageComposer } from '../../api';
import { Column, Flex, Grid, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useMessageEvent, useRoomEngineEvent } from '../../hooks';
import { BadgesContainerView } from './views/BadgesContainerView';
import { FriendsContainerView } from './views/FriendsContainerView';
import { GroupsContainerView } from './views/GroupsContainerView';
import { UserContainerView } from './views/UserContainerView';

const DEFAULT_PROFILE_COVER = '/assets/images/capas/default-cover.png';

export const UserProfileView: FC<{}> = props =>
{
    const [ userProfile, setUserProfile ] = useState<UserProfileParser>(null);
    const [ userBadges, setUserBadges ] = useState<string[]>([]);
    const [ userRelationships, setUserRelationships ] = useState<RelationshipStatusInfoMessageParser>(null);
    const [ coverUrl, setCoverUrl ] = useState<string>(null);

    const coverRequestRef = useRef(0);

    const loadProfileCover = (userId: number, username: string) =>
    {
        const requestId = ++coverRequestRef.current;

        setCoverUrl(null);

        const url = `https://habbriol.pro/api_capas.php?user_id=${ encodeURIComponent(userId) }&username=${ encodeURIComponent(username || '') }`;

        fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        })
            .then(response => response.json())
            .then(data =>
            {
                if(requestId !== coverRequestRef.current) return;

                if(data && data.success && data.cover)
                {
                    setCoverUrl(String(data.cover));
                }
                else
                {
                    setCoverUrl(DEFAULT_PROFILE_COVER);
                }
            })
            .catch(() =>
            {
                if(requestId !== coverRequestRef.current) return;

                setCoverUrl(DEFAULT_PROFILE_COVER);
            });
    };

    const onClose = () =>
    {
        coverRequestRef.current++;

        setUserProfile(null);
        setUserBadges([]);
        setUserRelationships(null);
        setCoverUrl(null);
    };

    const onLeaveGroup = () =>
    {
        if(!userProfile || (userProfile.id !== GetSessionDataManager().userId)) return;

        GetUserProfile(userProfile.id);
    };

    useMessageEvent<UserCurrentBadgesEvent>(UserCurrentBadgesEvent, event =>
    {
        const parser = event.getParser();

        if(!userProfile || (parser.userId !== userProfile.id)) return;

        setUserBadges(parser.badges);
    });

    useMessageEvent<RelationshipStatusInfoEvent>(RelationshipStatusInfoEvent, event =>
    {
        const parser = event.getParser();

        if(!userProfile || (parser.userId !== userProfile.id)) return;

        setUserRelationships(parser);
    });

    useMessageEvent<UserProfileEvent>(UserProfileEvent, event =>
    {
        const parser = event.getParser();

        let isSameProfile = false;

        setUserProfile(prevValue =>
        {
            if(prevValue && prevValue.id) isSameProfile = (prevValue.id === parser.id);

            return parser;
        });

        if(!isSameProfile)
        {
            setUserBadges([]);
            setUserRelationships(null);
            setCoverUrl(null);
        }

        loadProfileCover(parser.id, parser.username);

        SendMessageComposer(new UserCurrentBadgesComposer(parser.id));
        SendMessageComposer(new UserRelationshipsComposer(parser.id));
    });

    useMessageEvent<ExtendedProfileChangedMessageEvent>(ExtendedProfileChangedMessageEvent, event =>
    {
        const parser = event.getParser();

        if(parser.userId !== userProfile?.id) return;

        GetUserProfile(parser.userId);
    });

    useRoomEngineEvent<RoomEngineObjectEvent>(RoomEngineObjectEvent.SELECTED, event =>
    {
        if(!userProfile) return;

        if(event.category !== RoomObjectCategory.UNIT) return;

        const userData = GetRoomSession().userDataManager.getUserDataByIndex(event.objectId);

        if(userData.type !== RoomObjectType.USER) return;

        GetUserProfile(userData.webID);
    });

    if(!userProfile) return null;

    return (
        <NitroCardView uniqueKey="nitro-user-profile" theme="primary-slim" className="user-profile w-[400px]">
            <NitroCardHeaderView headerText={ LocalizeText('extendedprofile.caption') } onCloseClick={ onClose } />

            <div
                className="user-profile-cover"
                style={{
                    backgroundImage: `url(${ coverUrl || DEFAULT_PROFILE_COVER })`
                }}
            >
                <div className="user-profile-cover-shadow" />
            </div>

            <NitroCardContentView overflow="hidden" className="p-3">
                <Grid fullHeight={ false } gap={ 3 }>
                    <Column size={ 7 } gap={ 2 } className="user-container">
                        <UserContainerView userProfile={ userProfile } />

                        <div className="bg-muted rounded-lg p-2 shadow-inner">
                            <Grid columnCount={ 5 } fullHeight className="items-center">
                                <BadgesContainerView fullWidth center badges={ userBadges } />
                            </Grid>
                        </div>
                    </Column>

                    <Column size={ 5 } gap={ 2 }>
                        { userRelationships &&
                            <div className="bg-muted rounded-lg p-2 h-full shadow-inner">
                                <FriendsContainerView relationships={ userRelationships } friendsCount={ userProfile.friendsCount } />
                            </div>
                        }
                    </Column>
                </Grid>

                <Flex alignItems="center" justifyContent="between" className="bg-muted rounded-lg px-3 py-2 mt-2 shadow-sm">
                    <Flex
                        alignItems="center"
                        gap={ 2 }
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={ () => CreateLinkEvent(`navigator/search/hotel_view/owner:${ userProfile.username }`) }
                    >
                        <i className="icon icon-rooms" />
                        <Text bold underline>{ LocalizeText('extendedprofile.rooms') }</Text>
                    </Flex>
                </Flex>

                <div className="mt-2">
                    <GroupsContainerView
                        fullWidth
                        itsMe={ userProfile.id === GetSessionDataManager().userId }
                        groups={ userProfile.groups }
                        onLeaveGroup={ onLeaveGroup }
                    />
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
