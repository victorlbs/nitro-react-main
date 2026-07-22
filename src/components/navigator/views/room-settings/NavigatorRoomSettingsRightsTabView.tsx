import { FlatControllerAddedEvent, FlatControllerRemovedEvent, FlatControllersEvent, RemoveAllRightsMessageComposer, RoomTakeRightsComposer, RoomUsersWithRightsComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { Button, Column, Flex, Grid, Text, UserProfileIconView } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean) => void;
}

export const NavigatorRoomSettingsRightsTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null } = props;
    const [ usersWithRights, setUsersWithRights ] = useState<Map<number, string>>(new Map());
    const [ selectedUserId, setSelectedUserId ] = useState<number>(-1);
    const [ searchValue, setSearchValue ] = useState('');

    const filteredUsers = useMemo(() =>
    {
        const search = searchValue.trim().toLowerCase();
        const users = Array.from(usersWithRights.entries());

        if(!search) return users;

        return users.filter(([ id, name ]) => name.toLowerCase().includes(search));
    }, [ usersWithRights, searchValue ]);

    useMessageEvent<FlatControllersEvent>(FlatControllersEvent, event =>
    {
        const parser = event.getParser();

        if(!roomData || (roomData.roomId !== parser.roomId)) return;

        setUsersWithRights(parser.users);
    });

    useMessageEvent<FlatControllerAddedEvent>(FlatControllerAddedEvent, event =>
    {
        const parser = event.getParser();

        if(!roomData || (roomData.roomId !== parser.roomId)) return;

        setUsersWithRights(prevValue =>
        {
            const newValue = new Map(prevValue);

            newValue.set(parser.data.userId, parser.data.userName);

            return newValue;
        });
    });

    useMessageEvent<FlatControllerRemovedEvent>(FlatControllerRemovedEvent, event =>
    {
        const parser = event.getParser();

        if(!roomData || (roomData.roomId !== parser.roomId)) return;

        setUsersWithRights(prevValue =>
        {
            const newValue = new Map(prevValue);

            newValue.delete(parser.userId);

            return newValue;
        });

        if(selectedUserId === parser.userId) setSelectedUserId(-1);
    });

    useEffect(() =>
    {
        SendMessageComposer(new RoomUsersWithRightsComposer(roomData.roomId));
    }, [ roomData.roomId ]);

    return (
        <Grid className="room-settings-rights-ux" overflow="hidden">
            <Column size={ 7 } className="room-settings-card" gap={ 2 } overflow="hidden">
                <Flex justifyContent="between" alignItems="center" gap={ 2 }>
                    <Column gap={ 0 }>
                        <Text bold>{ LocalizeText('navigator.flatctrls.userswithrights', [ 'displayed', 'total' ], [ filteredUsers.length.toString(), usersWithRights.size.toString() ]) }</Text>
                        <Text small>Selecione um usuário para remover os direitos.</Text>
                    </Column>
                </Flex>

                <input className="form-control form-control-sm" placeholder="Buscar usuário com direitos..." value={ searchValue } onChange={ event => setSearchValue(event.target.value) } />

                <Flex overflow="hidden" className="room-settings-user-list">
                    <Column fullWidth overflow="auto" gap={ 1 }>
                        { filteredUsers.map(([ id, name ], index) =>
                        {
                            return (
                                <Flex key={ index } shrink alignItems="center" gap={ 1 } overflow="hidden" className={ `room-settings-user-row${ selectedUserId === id ? ' active' : '' }` } onClick={ event => setSelectedUserId(id) }>
                                    <UserProfileIconView userName={ name } />
                                    <Text pointer grow truncate>{ name }</Text>
                                </Flex>
                            );
                        }) }
                    </Column>
                </Flex>
            </Column>

            <Column size={ 5 } className="room-settings-card" justifyContent="between" gap={ 2 }>
                <Column gap={ 1 }>
                    <Text bold>Ações</Text>
                    <Text small>{ selectedUserId > 0 ? `Selecionado: ${ usersWithRights.get(selectedUserId) }` : 'Nenhum usuário selecionado.' }</Text>
                </Column>

                <Column gap={ 1 }>
                    <Button disabled={ selectedUserId <= 0 } onClick={ event =>
                    {
                        SendMessageComposer(new RoomTakeRightsComposer(selectedUserId));
                        setSelectedUserId(-1);
                    } }>
                        Remover selecionado
                    </Button>
                    <Button variant="danger" disabled={ !usersWithRights.size } onClick={ event => SendMessageComposer(new RemoveAllRightsMessageComposer(roomData.roomId)) }>
                        { LocalizeText('navigator.flatctrls.clear') }
                    </Button>
                </Column>
            </Column>
        </Grid>
    );
};
