import { RoomDataParser } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { IRoomData, LocalizeText } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';

interface NavigatorRoomSettingsTabViewProps
{
    roomData: IRoomData;
    handleChange: (field: string, value: string | number | boolean) => void;
}

const ACCESS_OPTIONS = [
    {
        state: RoomDataParser.OPEN_STATE,
        title: 'Aberto',
        desc: 'Qualquer usuário pode entrar no quarto.',
        icon: '🔓'
    },
    {
        state: RoomDataParser.DOORBELL_STATE,
        title: 'Campainha',
        desc: 'Você escolhe quem pode entrar.',
        icon: '🔔'
    },
    {
        state: RoomDataParser.INVISIBLE_STATE,
        title: 'Invisível',
        desc: 'O quarto fica oculto na navegação.',
        icon: '👻'
    },
    {
        state: RoomDataParser.PASSWORD_STATE,
        title: 'Senha',
        desc: 'Apenas usuários com a senha entram.',
        icon: '🔑'
    }
];

export const NavigatorRoomSettingsAccessTabView: FC<NavigatorRoomSettingsTabViewProps> = props =>
{
    const { roomData = null, handleChange = null } = props;
    const [ password, setPassword ] = useState<string>('');
    const [ confirmPassword, setConfirmPassword ] = useState('');
    const [ isTryingPassword, setIsTryingPassword ] = useState(false);

    const saveRoomPassword = () =>
    {
        if(!isTryingPassword || ((password.length <= 0) || (confirmPassword.length <= 0) || (password !== confirmPassword))) return;

        handleChange('password', password);
    };

    const selectAccessState = (state: number) =>
    {
        if(state === RoomDataParser.PASSWORD_STATE)
        {
            setIsTryingPassword(true);
            handleChange('lock_state', state);
            return;
        }

        setIsTryingPassword(false);
        handleChange('lock_state', state);
    };

    useEffect(() =>
    {
        setPassword('');
        setConfirmPassword('');
        setIsTryingPassword(roomData.lockState === RoomDataParser.PASSWORD_STATE);
    }, [ roomData ]);

    return (
        <Column gap={ 2 }>
            <Column className="room-settings-card" gap={ 2 }>
                <Column gap={ 0 }>
                    <Text bold>{ LocalizeText('navigator.roomsettings.roomaccess.caption') }</Text>
                    <Text small>{ LocalizeText('navigator.roomsettings.roomaccess.info') }</Text>
                </Column>

                <div className="room-settings-access-grid">
                    { ACCESS_OPTIONS.map(option =>
                    {
                        const isPassword = (option.state === RoomDataParser.PASSWORD_STATE);
                        const active = isPassword ? ((roomData.lockState === RoomDataParser.PASSWORD_STATE) || isTryingPassword) : ((roomData.lockState === option.state) && !isTryingPassword);

                        return (
                            <button key={ option.state } type="button" className={ `room-settings-access-card${ active ? ' active' : '' }` } onClick={ () => selectAccessState(option.state) }>
                                <span className="room-settings-access-icon">{ option.icon }</span>
                                <b>{ option.title }</b>
                                <small>{ option.desc }</small>
                            </button>
                        );
                    }) }
                </div>

                { ((roomData.lockState === RoomDataParser.PASSWORD_STATE) || isTryingPassword) &&
                    <Column className="room-settings-password-box" gap={ 1 }>
                        <Text bold>{ LocalizeText('navigator.roomsettings.doormode.password') }</Text>
                        <Flex gap={ 1 }>
                            <input type="password" className="form-control form-control-sm" value={ password } onChange={ event => setPassword(event.target.value) } placeholder={ LocalizeText('navigator.roomsettings.password') } onFocus={ event => setIsTryingPassword(true) } />
                            <input type="password" className="form-control form-control-sm" value={ confirmPassword } onChange={ event => setConfirmPassword(event.target.value) } onBlur={ saveRoomPassword } placeholder={ LocalizeText('navigator.roomsettings.passwordconfirm') } />
                        </Flex>
                        { isTryingPassword && (password.length <= 0) &&
                            <Text bold small variant="danger">{ LocalizeText('navigator.roomsettings.passwordismandatory') }</Text> }
                        { isTryingPassword && ((password.length > 0) && (password !== confirmPassword)) &&
                            <Text bold small variant="danger">{ LocalizeText('navigator.roomsettings.invalidconfirm') }</Text> }
                    </Column> }
            </Column>

            <Column className="room-settings-card" gap={ 2 }>
                <Column gap={ 0 }>
                    <Text bold>{ LocalizeText('navigator.roomsettings.pets') }</Text>
                    <Text small>Controle se pets podem entrar e consumir comida no quarto.</Text>
                </Column>
                <label className="room-settings-check-row">
                    <input className="form-check-input" type="checkbox" checked={ roomData.allowPets } onChange={ event => handleChange('allow_pets', event.target.checked) } />
                    <span>{ LocalizeText('navigator.roomsettings.allowpets') }</span>
                </label>
                <label className="room-settings-check-row">
                    <input className="form-check-input" type="checkbox" checked={ roomData.allowPetsEat } onChange={ event => handleChange('allow_pets_eat', event.target.checked) } />
                    <span>{ LocalizeText('navigator.roomsettings.allowfoodconsume') }</span>
                </label>
            </Column>
        </Column>
    );
};
