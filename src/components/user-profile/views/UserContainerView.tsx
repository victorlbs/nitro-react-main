import
    {
        FriendlyTime,
        RequestFriendComposer,
        UserProfileParser
    } from '@nitrots/nitro-renderer';

import { FC, useEffect, useState } from 'react';

import
    {
        GetSessionDataManager,
        SendMessageComposer
    } from '../../../api';

import
    {
        LayoutAvatarImageView,
        Text
    } from '../../../common';

interface UserContainerViewProps
{
    userProfile: UserProfileParser;
}

export const UserContainerView: FC<UserContainerViewProps> = props =>
{
    const { userProfile = null } = props;

    const [ requestSent, setRequestSent ] = useState(userProfile.requestSent);

    const isOwnProfile = (userProfile.id === GetSessionDataManager().userId);

    const canSendFriendRequest =
    (
        !requestSent &&
        !isOwnProfile &&
        !userProfile.isMyFriend &&
        !userProfile.requestSent
    );

    const addFriend = () =>
    {
        setRequestSent(true);

        SendMessageComposer(
            new RequestFriendComposer(userProfile.username)
        );
    }

    useEffect(() =>
    {
        setRequestSent(userProfile.requestSent);
    }, [ userProfile ]);

    return (
        <div className="profile-header">

            <div className="profile-avatar-card">
                <LayoutAvatarImageView
                    figure={ userProfile.figure }
                    direction={ 2 }
                />

                <div className={ `status-badge ${ userProfile.isOnline ? 'online' : 'offline' }` }>
                    { userProfile.isOnline ? 'ONLINE' : 'OFFLINE' }
                </div>
            </div>

            <div className="profile-information">

                <div className="profile-user-info">
                    <Text bold className="profile-username">
                        { userProfile.username }
                    </Text>

                    <Text italics className="profile-motto">
                        { userProfile.motto || 'Sem missão definida.' }
                    </Text>
                </div>

                <div className="profile-details">

                    <div className="profile-detail">
                        <span>Criado em</span>
                        <strong>{ userProfile.registration }</strong>
                    </div>

                    <div className="profile-detail">
                        <span>Último acesso</span>
                        <strong>
                            {
                                FriendlyTime.format(
                                    userProfile.secondsSinceLastVisit,
                                    '.ago',
                                    2
                                )
                            }
                        </strong>
                    </div>

                    <div className="profile-detail">
                        <span>Placar</span>
                        <strong>
                            { userProfile.achievementPoints.toLocaleString() }
                        </strong>
                    </div>

                </div>

                <div className="profile-actions">

                    {
                        canSendFriendRequest &&
                        <button
                            className="profile-btn add-friend"
                            onClick={ addFriend }>
                            Adicionar amigo
                        </button>
                    }

                    {
                        !canSendFriendRequest &&
                        <div className="friend-status">

                            <i className="icon icon-pf-tick" />

                            {
                                isOwnProfile &&
                                <Text>Este é você</Text>
                            }

                            {
                                userProfile.isMyFriend &&
                                <Text>Já é seu amigo</Text>
                            }

                            {
                                (requestSent || userProfile.requestSent) &&
                                <Text>Solicitação enviada</Text>
                            }

                        </div>
                    }

                </div>

            </div>

        </div>
    );
}
