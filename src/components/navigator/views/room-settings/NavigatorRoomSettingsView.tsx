import { RoomBannedUsersComposer, RoomDataParser, RoomSettingsDataEvent, SaveRoomSettingsComposer } from '@nitrots/nitro-renderer';
import { FC, useMemo, useState } from 'react';
import { IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { Button, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardTabsItemView, NitroCardTabsView, NitroCardView, Text } from '../../../../common';
import { useMessageEvent } from '../../../../hooks';
import { NavigatorRoomSettingsAccessTabView } from './NavigatorRoomSettingsAccessTabView';
import { NavigatorRoomSettingsBasicTabView } from './NavigatorRoomSettingsBasicTabView';
import { NavigatorRoomSettingsModTabView } from './NavigatorRoomSettingsModTabView';
import { NavigatorRoomSettingsRightsTabView } from './NavigatorRoomSettingsRightsTabView';
import { NavigatorRoomSettingsVipChatTabView } from './NavigatorRoomSettingsVipChatTabView';
import './NavigatorRoomSettingsView.scss';

const TABS: string[] = [
    'navigator.roomsettings.tab.1',
    'navigator.roomsettings.tab.2',
    'navigator.roomsettings.tab.3',
    'navigator.roomsettings.tab.4',
    'navigator.roomsettings.tab.5'
];

const cloneRoomData = (roomData: IRoomData): IRoomData =>
{
    if(!roomData) return null;

    return {
        ...roomData,
        tags: [ ...(roomData.tags || []) ],
        chatSettings: { ...roomData.chatSettings },
        moderationSettings: { ...roomData.moderationSettings }
    };
};

const normalizeRoomDataForCompare = (roomData: IRoomData) =>
{
    if(!roomData) return null;

    return {
        roomName: roomData.roomName,
        roomDescription: roomData.roomDescription,
        categoryId: Number(roomData.categoryId),
        userCount: Number(roomData.userCount),
        tags: roomData.tags || [],
        tradeState: Number(roomData.tradeState),
        allowWalkthrough: !!roomData.allowWalkthrough,
        lockState: Number(roomData.lockState),
        password: roomData.password || null,
        allowPets: !!roomData.allowPets,
        allowPetsEat: !!roomData.allowPetsEat,
        hideWalls: !!roomData.hideWalls,
        wallThickness: Number(roomData.wallThickness),
        floorThickness: Number(roomData.floorThickness),
        chatSettings: {
            mode: Number(roomData.chatSettings.mode),
            weight: Number(roomData.chatSettings.weight),
            speed: Number(roomData.chatSettings.speed),
            distance: Number(roomData.chatSettings.distance),
            protection: Number(roomData.chatSettings.protection)
        },
        moderationSettings: {
            allowMute: Number(roomData.moderationSettings.allowMute),
            allowKick: Number(roomData.moderationSettings.allowKick),
            allowBan: Number(roomData.moderationSettings.allowBan)
        }
    };
};

export const NavigatorRoomSettingsView: FC<{}> = props =>
{
    const [ roomData, setRoomData ] = useState<IRoomData>(null);
    const [ originalRoomData, setOriginalRoomData ] = useState<IRoomData>(null);
    const [ currentTab, setCurrentTab ] = useState(TABS[0]);
    const [ saveMessage, setSaveMessage ] = useState<string>('');

    const hasChanges = useMemo(() =>
    {
        if(!roomData || !originalRoomData) return false;

        return JSON.stringify(normalizeRoomDataForCompare(roomData)) !== JSON.stringify(normalizeRoomDataForCompare(originalRoomData));
    }, [ roomData, originalRoomData ]);

    useMessageEvent<RoomSettingsDataEvent>(RoomSettingsDataEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        const data = parser.data;

        const nextRoomData: IRoomData = {
            roomId: data.roomId,
            roomName: data.name,
            roomDescription: data.description,
            categoryId: data.categoryId,
            userCount: data.maximumVisitorsLimit,
            tags: data.tags,
            tradeState: data.tradeMode,
            allowWalkthrough: data.allowWalkThrough,
            lockState: data.doorMode,
            password: null,
            allowPets: data.allowPets,
            allowPetsEat: data.allowFoodConsume,
            hideWalls: data.hideWalls,
            wallThickness: data.wallThickness,
            floorThickness: data.floorThickness,
            chatSettings: {
                mode: data.chatSettings.mode,
                weight: data.chatSettings.weight,
                speed: data.chatSettings.speed,
                distance: data.chatSettings.distance,
                protection: data.chatSettings.protection
            },
            moderationSettings: {
                allowMute: data.roomModerationSettings.allowMute,
                allowKick: data.roomModerationSettings.allowKick,
                allowBan: data.roomModerationSettings.allowBan
            }
        };

        setRoomData(nextRoomData);
        setOriginalRoomData(cloneRoomData(nextRoomData));
        setSaveMessage('');

        SendMessageComposer(new RoomBannedUsersComposer(data.roomId));
    });

    const onClose = () =>
    {
        if(hasChanges && !window.confirm('Você tem alterações não salvas. Deseja fechar mesmo assim?')) return;

        setRoomData(null);
        setOriginalRoomData(null);
        setCurrentTab(TABS[0]);
        setSaveMessage('');
    };

    const discardChanges = () =>
    {
        if(!originalRoomData) return;

        setRoomData(cloneRoomData(originalRoomData));
        setSaveMessage('Alterações descartadas.');
    };

    const saveChanges = () =>
    {
        if(!roomData) return;

        const tags = (roomData.tags || []).filter(tag => !!tag);

        SendMessageComposer(
            new SaveRoomSettingsComposer(
                roomData.roomId,
                roomData.roomName,
                roomData.roomDescription,
                roomData.lockState,
                roomData.password,
                roomData.userCount,
                roomData.categoryId,
                tags.length,
                tags,
                roomData.tradeState,
                roomData.allowPets,
                roomData.allowPetsEat,
                roomData.allowWalkthrough,
                roomData.hideWalls,
                roomData.wallThickness,
                roomData.floorThickness,
                roomData.moderationSettings.allowMute,
                roomData.moderationSettings.allowKick,
                roomData.moderationSettings.allowBan,
                roomData.chatSettings.mode,
                roomData.chatSettings.weight,
                roomData.chatSettings.speed,
                roomData.chatSettings.distance,
                roomData.chatSettings.protection
            ));

        const saved = cloneRoomData(roomData);

        saved.password = null;

        setOriginalRoomData(saved);
        setRoomData(saved);
        setSaveMessage('Preferências salvas com sucesso.');
    };

    const handleChange = (field: string, value: string | number | boolean | string[]) =>
    {
        setSaveMessage('');

        setRoomData(prevValue =>
        {
            if(!prevValue) return prevValue;

            const newValue: IRoomData = {
                ...prevValue,
                tags: [ ...(prevValue.tags || []) ],
                chatSettings: { ...prevValue.chatSettings },
                moderationSettings: { ...prevValue.moderationSettings }
            };

            switch(field)
            {
                case 'name':
                    newValue.roomName = String(value);
                    break;
                case 'description':
                    newValue.roomDescription = String(value);
                    break;
                case 'category':
                    newValue.categoryId = Number(value);
                    break;
                case 'max_visitors':
                    newValue.userCount = Number(value);
                    break;
                case 'trade_state':
                    newValue.tradeState = Number(value);
                    break;
                case 'tags':
                    newValue.tags = (value as Array<string>).map(tag => String(tag || '').trim()).filter((tag, index) => (index < 2));
                    break;
                case 'allow_walkthrough':
                    newValue.allowWalkthrough = Boolean(value);
                    break;
                case 'allow_pets':
                    newValue.allowPets = Boolean(value);
                    break;
                case 'allow_pets_eat':
                    newValue.allowPetsEat = Boolean(value);
                    break;
                case 'hide_walls':
                    newValue.hideWalls = Boolean(value);
                    break;
                case 'wall_thickness':
                    newValue.wallThickness = Number(value);
                    break;
                case 'floor_thickness':
                    newValue.floorThickness = Number(value);
                    break;
                case 'lock_state':
                    newValue.lockState = Number(value);
                    if(Number(value) !== RoomDataParser.PASSWORD_STATE) newValue.password = null;
                    break;
                case 'password':
                    newValue.lockState = RoomDataParser.PASSWORD_STATE;
                    newValue.password = String(value);
                    break;
                case 'moderation_mute':
                    newValue.moderationSettings.allowMute = Number(value);
                    break;
                case 'moderation_kick':
                    newValue.moderationSettings.allowKick = Number(value);
                    break;
                case 'moderation_ban':
                    newValue.moderationSettings.allowBan = Number(value);
                    break;
                case 'bubble_mode':
                    newValue.chatSettings.mode = Number(value);
                    break;
                case 'chat_weight':
                    newValue.chatSettings.weight = Number(value);
                    break;
                case 'bubble_speed':
                    newValue.chatSettings.speed = Number(value);
                    break;
                case 'flood_protection':
                    newValue.chatSettings.protection = Number(value);
                    break;
                case 'chat_distance':
                    newValue.chatSettings.distance = Number(value);
                    break;
            }

            return newValue;
        });
    };

    if(!roomData) return null;

    return (
        <NitroCardView uniqueKey="nitro-room-settings" className={ `nitro-room-settings room-settings-ux${ hasChanges ? ' has-unsaved-changes' : '' }` }>
            <NitroCardHeaderView headerText={ LocalizeText('navigator.roomsettings') } onCloseClick={ onClose } />
            <NitroCardTabsView>
                { TABS.map(tab => <NitroCardTabsItemView key={ tab } isActive={ (currentTab === tab) } onClick={ event => setCurrentTab(tab) }>{ LocalizeText(tab) }</NitroCardTabsItemView>) }
            </NitroCardTabsView>
            <NitroCardContentView className="room-settings-ux-content">
                <Flex className="room-settings-status-bar" alignItems="center" justifyContent="between" gap={ 2 }>
                    <Text truncate>
                        { hasChanges ? 'Você tem alterações não salvas.' : (saveMessage || 'Edite as preferências do quarto com segurança.') }
                    </Text>
                    <Flex gap={ 1 } shrink>
                        <Button variant="secondary" disabled={ !hasChanges } onClick={ discardChanges }>Descartar</Button>
                        <Button variant="success" disabled={ !hasChanges } onClick={ saveChanges }>Salvar alterações</Button>
                    </Flex>
                </Flex>

                <div className="room-settings-tab-content">
                    { (currentTab === TABS[0]) &&
                        <NavigatorRoomSettingsBasicTabView roomData={ roomData } handleChange={ handleChange } onClose={ onClose } /> }
                    { (currentTab === TABS[1]) &&
                        <NavigatorRoomSettingsAccessTabView roomData={ roomData } handleChange={ handleChange } /> }
                    { (currentTab === TABS[2]) &&
                        <NavigatorRoomSettingsRightsTabView roomData={ roomData } handleChange={ handleChange } /> }
                    { (currentTab === TABS[3]) &&
                        <NavigatorRoomSettingsVipChatTabView roomData={ roomData } handleChange={ handleChange } /> }
                    { (currentTab === TABS[4]) &&
                        <NavigatorRoomSettingsModTabView roomData={ roomData } handleChange={ handleChange } /> }
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
