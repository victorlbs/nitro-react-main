import { RoomDataParser, RoomDeleteComposer, RoomSettingsSaveErrorEvent, RoomSettingsSaveErrorParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { CreateLinkEvent, GetMaxVisitorsList, IRoomData, LocalizeText, SendMessageComposer } from '../../../../api';
import { Base, Button, Column, Flex, Text } from '../../../../common';
import { useMessageEvent, useNavigator, useNotification } from '../../../../hooks';

const ROOM_NAME_MIN_LENGTH = 3;
const ROOM_NAME_MAX_LENGTH = 60;
const DESC_MAX_LENGTH = 255;
const TAGS_MAX_LENGTH = 15;

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean | string[]) => void;
    onClose: () => void;
}

export const NavigatorRoomSettingsBasicTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null, handleChange = null, onClose = null } = props;
    const [ roomName, setRoomName ] = useState<string>('');
    const [ roomDescription, setRoomDescription ] = useState<string>('');
    const [ roomTag1, setRoomTag1 ] = useState<string>('');
    const [ roomTag2, setRoomTag2 ] = useState<string>('');
    const [ tagIndex, setTagIndex ] = useState(0);
    const [ typeError, setTypeError ] = useState<string>('');
    const { showConfirm = null } = useNotification();
    const { categories = null } = useNavigator();

    useMessageEvent<RoomSettingsSaveErrorEvent>(RoomSettingsSaveErrorEvent, event =>
    {
        const parser = event.getParser();

        if(!parser) return;

        switch(parser.code)
        {
            case RoomSettingsSaveErrorParser.ERROR_INVALID_TAG:
                setTypeError('navigator.roomsettings.unacceptablewords');
                break;
            case RoomSettingsSaveErrorParser.ERROR_NON_USER_CHOOSABLE_TAG:
                setTypeError('navigator.roomsettings.nonuserchoosabletag');
                break;
            default:
                setTypeError('');
                break;
        }
    });

    const deleteRoom = () =>
    {
        showConfirm(LocalizeText('navigator.roomsettings.deleteroom.confirm.message', [ 'room_name' ], [ roomData.roomName ]), () =>
        {
            SendMessageComposer(new RoomDeleteComposer(roomData.roomId));

            if(onClose) onClose();

            CreateLinkEvent('navigator/search/myworld_view');
        }, null, null, null, LocalizeText('navigator.roomsettings.deleteroom.confirm.title'));
    };

    const updateName = (value: string) =>
    {
        setRoomName(value);
        if(value.length >= ROOM_NAME_MIN_LENGTH && value.length <= ROOM_NAME_MAX_LENGTH) handleChange('name', value);
    };

    const updateDescription = (value: string) =>
    {
        setRoomDescription(value);
        if(value.length <= DESC_MAX_LENGTH) handleChange('description', value);
    };

    const updateTags = (tag1: string, tag2: string, index: number) =>
    {
        setTypeError('');
        setTagIndex(index);

        if(tag1.length > TAGS_MAX_LENGTH || tag2.length > TAGS_MAX_LENGTH) return;

        const tags = (tag1 === '' && tag2 !== '') ? [ tag2 ] : [ tag1, tag2 ];

        handleChange('tags', tags);
    };

    const applyPreset = (preset: 'public' | 'trade' | 'private' | 'event') =>
    {
        switch(preset)
        {
            case 'public':
                handleChange('lock_state', RoomDataParser.OPEN_STATE);
                handleChange('trade_state', 0);
                handleChange('allow_walkthrough', true);
                handleChange('max_visitors', 100);
                return;
            case 'trade':
                handleChange('lock_state', RoomDataParser.OPEN_STATE);
                handleChange('trade_state', 2);
                handleChange('allow_walkthrough', true);
                handleChange('max_visitors', 100);
                return;
            case 'private':
                handleChange('lock_state', RoomDataParser.DOORBELL_STATE);
                handleChange('trade_state', 0);
                handleChange('allow_walkthrough', false);
                handleChange('max_visitors', 25);
                return;
            case 'event':
                handleChange('lock_state', RoomDataParser.OPEN_STATE);
                handleChange('trade_state', 0);
                handleChange('allow_walkthrough', true);
                handleChange('max_visitors', 100);
                return;
        }
    };

    useEffect(() =>
    {
        setRoomName(roomData.roomName);
        setRoomDescription(roomData.roomDescription);
        setRoomTag1((roomData.tags.length > 0 && roomData.tags[0]) ? roomData.tags[0] : '');
        setRoomTag2((roomData.tags.length > 0 && roomData.tags[1]) ? roomData.tags[1] : '');
    }, [ roomData ]);

    return (
        <Column className="room-settings-basic-ux" gap={ 2 }>
            <Column className="room-settings-card" gap={ 2 }>
                <Flex justifyContent="between" alignItems="center" gap={ 2 }>
                    <Column gap={ 0 }>
                        <Text bold>Informações do quarto</Text>
                        <Text small>Nome, descrição e categoria principal.</Text>
                    </Column>
                    <Text small>{ roomName.length }/{ ROOM_NAME_MAX_LENGTH }</Text>
                </Flex>

                <div className="room-settings-field-grid">
                    <Text className="room-settings-label">Nome do Quarto</Text>
                    <Column gap={ 0 }>
                        <input className="form-control form-control-sm" value={ roomName } maxLength={ ROOM_NAME_MAX_LENGTH } onChange={ event => updateName(event.target.value) } />
                        { (roomName.length < ROOM_NAME_MIN_LENGTH) &&
                            <Text bold small variant="danger">{ LocalizeText('navigator.roomsettings.roomnameismandatory') }</Text> }
                    </Column>
                </div>

                <div className="room-settings-field-grid room-settings-field-grid-top">
                    <Text className="room-settings-label">Descrição</Text>
                    <Column gap={ 0 }>
                        <textarea className="form-control form-control-sm room-settings-description" value={ roomDescription } maxLength={ DESC_MAX_LENGTH } onChange={ event => updateDescription(event.target.value) } />
                        <Flex justifyContent="between">
                            <Text small>Uma descrição curta ajuda os usuários a entenderem o objetivo do quarto.</Text>
                            <Text small>{ roomDescription.length }/{ DESC_MAX_LENGTH }</Text>
                        </Flex>
                    </Column>
                </div>

                <div className="room-settings-field-grid">
                    <Text className="room-settings-label">Categoria</Text>
                    <select className="form-select form-select-sm" value={ roomData.categoryId } onChange={ event => handleChange('category', event.target.value) }>
                        { categories && categories.map(category => <option key={ category.id } value={ category.id }>{ LocalizeText(category.name) }</option>) }
                    </select>
                </div>
            </Column>

            <Column className="room-settings-card" gap={ 2 }>
                <Flex justifyContent="between" alignItems="center" gap={ 2 }>
                    <Column gap={ 0 }>
                        <Text bold>Configuração rápida</Text>
                        <Text small>Use um preset e ajuste depois se quiser.</Text>
                    </Column>
                </Flex>
                <Flex gap={ 1 } style={ { flexWrap: 'wrap' } }>
                    <Button variant="secondary" onClick={ () => applyPreset('public') }>Quarto público</Button>
                    <Button variant="secondary" onClick={ () => applyPreset('trade') }>Quarto de trocas</Button>
                    <Button variant="secondary" onClick={ () => applyPreset('private') }>Privado</Button>
                    <Button variant="secondary" onClick={ () => applyPreset('event') }>Evento</Button>
                </Flex>

                <div className="room-settings-field-grid">
                    <Text className="room-settings-label">Número máximo de visitantes</Text>
                    <select className="form-select form-select-sm" value={ roomData.userCount } onChange={ event => handleChange('max_visitors', event.target.value) }>
                        { GetMaxVisitorsList && GetMaxVisitorsList.map(value => <option key={ value } value={ value }>{ value }</option>) }
                    </select>
                </div>

                <div className="room-settings-field-grid">
                    <Text className="room-settings-label">Preferências de Troca</Text>
                    <select className="form-select form-select-sm" value={ roomData.tradeState } onChange={ event => handleChange('trade_state', event.target.value) }>
                        <option value="0">{ LocalizeText('navigator.roomsettings.trade_not_allowed') }</option>
                        <option value="1">{ LocalizeText('navigator.roomsettings.trade_not_with_Controller') }</option>
                        <option value="2">{ LocalizeText('navigator.roomsettings.trade_allowed') }</option>
                    </select>
                </div>

                <label className="room-settings-check-row">
                    <input className="form-check-input" type="checkbox" checked={ roomData.allowWalkthrough } onChange={ event => handleChange('allow_walkthrough', event.target.checked) } />
                    <span>{ LocalizeText('navigator.roomsettings.allow_walk_through') }</span>
                </label>
            </Column>

            <Column className="room-settings-card" gap={ 2 }>
                <Flex justifyContent="between" alignItems="center" gap={ 2 }>
                    <Column gap={ 0 }>
                        <Text bold>Etiquetas</Text>
                        <Text small>Use até duas etiquetas com no máximo { TAGS_MAX_LENGTH } caracteres.</Text>
                    </Column>
                </Flex>

                <div className="room-settings-field-grid">
                    <Text className="room-settings-label">Etiquetas</Text>
                    <Flex gap={ 1 }>
                        <Column fullWidth gap={ 0 }>
                            <input className="form-control form-control-sm" value={ roomTag1 } maxLength={ TAGS_MAX_LENGTH } onChange={ event =>
                            {
                                setRoomTag1(event.target.value);
                                updateTags(event.target.value, roomTag2, 0);
                            } } />
                            { (tagIndex === 0 && typeError !== '') && <Text bold small variant="danger">{ LocalizeText(typeError) }</Text> }
                        </Column>
                        <Column fullWidth gap={ 0 }>
                            <input className="form-control form-control-sm" value={ roomTag2 } maxLength={ TAGS_MAX_LENGTH } onChange={ event =>
                            {
                                setRoomTag2(event.target.value);
                                updateTags(roomTag1, event.target.value, 1);
                            } } />
                            { (tagIndex === 1 && typeError !== '') && <Text bold small variant="danger">{ LocalizeText(typeError) }</Text> }
                        </Column>
                    </Flex>
                </div>

                <Flex gap={ 1 } style={ { flexWrap: 'wrap' } }>
                    { [ roomTag1, roomTag2 ].filter(tag => !!tag).map((tag, index) => <Base key={ index } className="room-settings-tag-chip">#{ tag }</Base>) }
                </Flex>
            </Column>

            <Column className="room-settings-card danger-zone" gap={ 1 }>
                <Text bold>Zona perigosa</Text>
                <Text small>Apagar o quarto é uma ação permanente.</Text>
                <Text variant="danger" underline bold pointer className="d-flex justify-content-center align-items-center gap-1 room-settings-delete" onClick={ deleteRoom }>
                    <FaTimes className="fa-icon" />
                    { LocalizeText('navigator.roomsettings.delete') }
                </Text>
            </Column>
        </Column>
    );
};
