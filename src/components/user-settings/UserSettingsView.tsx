import { ILinkEventTracker, NitroSettingsEvent, UserSettingsCameraFollowComposer, UserSettingsEvent, UserSettingsOldChatComposer, UserSettingsRoomInvitesComposer, UserSettingsSoundComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useState } from 'react';
import { FaVolumeDown, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { AddEventLinkTracker, DispatchMainEvent, DispatchUiEvent, LocalizeText, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { ApplyVideoSettingsRuntime, LoadVideoSettings, SaveVideoSettings, VIDEO_SETTINGS_DEFAULT, VideoSettings } from '../../api/video-settings';
import { classNames, Column, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView, Text } from '../../common';
import { useCatalogPlaceMultipleItems, useCatalogSkipPurchaseConfirmation, useMessageEvent } from '../../hooks';
import './UserSettingsView.scss';

type SettingsTab = 'general' | 'privacy' | 'advanced' | 'audio' | 'video';

export const UserSettingsView: FC<{}> = props =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTab, setActiveTab ] = useState<SettingsTab>('general');
    const [ userSettings, setUserSettings ] = useState<any>(null);
    const [ videoSettings, setVideoSettings ] = useState<VideoSettings>(() => LoadVideoSettings());

    const [ catalogPlaceMultipleObjects, setCatalogPlaceMultipleObjects ] = useCatalogPlaceMultipleItems();
    const [ catalogSkipPurchaseConfirmation, setCatalogSkipPurchaseConfirmation ] = useCatalogSkipPurchaseConfirmation();

    const processAction = (type: string, value?: boolean | number | string) =>
    {
        if(!userSettings) return;

        let doUpdate = true;

        const clone = userSettings.clone();

        switch(type)
        {
            case 'close_view':
                setIsVisible(false);
                doUpdate = false;
                return;

            case 'oldchat':
                clone.oldChat = value as boolean;
                SendMessageComposer(new UserSettingsOldChatComposer(clone.oldChat));
                break;

            case 'room_invites':
                clone.roomInvites = value as boolean;
                SendMessageComposer(new UserSettingsRoomInvitesComposer(clone.roomInvites));
                break;

            case 'camera_follow':
                clone.cameraFollow = value as boolean;
                SendMessageComposer(new UserSettingsCameraFollowComposer(clone.cameraFollow));
                break;

            case 'system_volume':
                clone.volumeSystem = Number(value);
                clone.volumeSystem = Math.max(0, clone.volumeSystem);
                clone.volumeSystem = Math.min(100, clone.volumeSystem);
                break;

            case 'furni_volume':
                clone.volumeFurni = Number(value);
                clone.volumeFurni = Math.max(0, clone.volumeFurni);
                clone.volumeFurni = Math.min(100, clone.volumeFurni);
                break;

            case 'trax_volume':
                clone.volumeTrax = Number(value);
                clone.volumeTrax = Math.max(0, clone.volumeTrax);
                clone.volumeTrax = Math.min(100, clone.volumeTrax);
                break;
        }

        if(doUpdate) setUserSettings(clone);

        DispatchMainEvent(clone);
    };

    const saveRangeSlider = (type: string) =>
    {
        if(!userSettings) return;

        switch(type)
        {
            case 'volume':
                SendMessageComposer(new UserSettingsSoundComposer(
                    Math.round(userSettings.volumeSystem),
                    Math.round(userSettings.volumeFurni),
                    Math.round(userSettings.volumeTrax)
                ));
                break;
        }
    };

    const updateVideoSetting = <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) =>
    {
        setVideoSettings(prevValue =>
        {
            const nextValue = SaveVideoSettings({
                ...prevValue,
                [key]: value
            });

            return nextValue;
        });
    };

    const resetVideoSettings = () =>
    {
        const nextValue = SaveVideoSettings(VIDEO_SETTINGS_DEFAULT);

        setVideoSettings(nextValue);
        ApplyVideoSettingsRuntime(nextValue);
    };

    useMessageEvent(UserSettingsEvent, event =>
    {
        const parser = event.getParser();
        const settingsEvent = new NitroSettingsEvent();

        settingsEvent.volumeSystem = parser.volumeSystem;
        settingsEvent.volumeFurni = parser.volumeFurni;
        settingsEvent.volumeTrax = parser.volumeTrax;
        settingsEvent.oldChat = parser.oldChat;
        settingsEvent.roomInvites = parser.roomInvites;
        settingsEvent.cameraFollow = parser.cameraFollow;
        settingsEvent.flags = parser.flags;
        settingsEvent.chatType = parser.chatType;

        setUserSettings(settingsEvent);

        DispatchMainEvent(settingsEvent);
    });

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
            eventUrlPrefix: 'user-settings/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, []);

    useEffect(() =>
    {
        if(!userSettings) return;

        DispatchUiEvent(userSettings);
    }, [ userSettings ]);

    useEffect(() =>
    {
        ApplyVideoSettingsRuntime(videoSettings);
    }, [ videoSettings ]);

    if(!isVisible || !userSettings) return null;

    return (
        <NitroCardView className="nitro-user-settings nitro-user-settings-video" uniqueKey="user-settings" theme="primary-slim">
            <NitroCardHeaderView headerText="Alterar opções" onCloseClick={ () => processAction('close_view') } />

            <NitroCardContentView className="nitro-user-settings-content text-black p-0" overflow="hidden">
                <div className="user-settings-tabs">
                    <button type="button" className={ activeTab === 'general' ? 'active' : '' } onClick={ () => setActiveTab('general') }>Geral</button>
                    <button type="button" className={ activeTab === 'privacy' ? 'active' : '' } onClick={ () => setActiveTab('privacy') }>Privacidade</button>
                    <button type="button" className={ activeTab === 'advanced' ? 'active' : '' } onClick={ () => setActiveTab('advanced') }>Avançadas</button>
                    <button type="button" className={ activeTab === 'audio' ? 'active' : '' } onClick={ () => setActiveTab('audio') }>Áudio</button>
                    <button type="button" className={ activeTab === 'video' ? 'active' : '' } onClick={ () => setActiveTab('video') }>Vídeo</button>
                </div>

                <div className="user-settings-panel">
                    { activeTab === 'general' &&
                        <Column gap={ 2 }>
                            <label className="settings-check-row">
                                <input type="checkbox" checked={ userSettings.oldChat } onChange={ event => processAction('oldchat', event.target.checked) } />
                                <span>{ LocalizeText('memenu.settings.chat.prefer.old.chat') }</span>
                            </label>

                            <label className="settings-check-row">
                                <input type="checkbox" checked={ userSettings.cameraFollow } onChange={ event => processAction('camera_follow', event.target.checked) } />
                                <span>{ LocalizeText('memenu.settings.other.disable.room.camera.follow') }</span>
                            </label>
                        </Column>
                    }

                    { activeTab === 'privacy' &&
                        <Column gap={ 2 }>
                            <label className="settings-check-row">
                                <input type="checkbox" checked={ userSettings.roomInvites } onChange={ event => processAction('room_invites', event.target.checked) } />
                                <span>{ LocalizeText('memenu.settings.other.ignore.room.invites') }</span>
                            </label>
                        </Column>
                    }

                    { activeTab === 'advanced' &&
                        <Column gap={ 2 }>
                            <label className="settings-check-row">
                                <input type="checkbox" checked={ catalogPlaceMultipleObjects } onChange={ event => setCatalogPlaceMultipleObjects(event.target.checked) } />
                                <span>{ LocalizeText('memenu.settings.other.place.multiple.objects') }</span>
                            </label>

                            <label className="settings-check-row">
                                <input type="checkbox" checked={ catalogSkipPurchaseConfirmation } onChange={ event => setCatalogSkipPurchaseConfirmation(event.target.checked) } />
                                <span>{ LocalizeText('memenu.settings.other.skip.purchase.confirmation') }</span>
                            </label>
                        </Column>
                    }

                    { activeTab === 'audio' &&
                        <Column gap={ 3 }>
                            <Text bold>{ LocalizeText('widget.memenu.settings.volume') }</Text>

                            <div className="settings-volume-row">
                                <Text>{ LocalizeText('widget.memenu.settings.volume.ui') }</Text>

                                <Flex alignItems="center" gap={ 1 }>
                                    { (userSettings.volumeSystem === 0) && <FaVolumeMute className="fa-icon" /> }
                                    { (userSettings.volumeSystem > 0) && <FaVolumeDown className={ classNames((userSettings.volumeSystem >= 50) && 'text-muted', 'fa-icon') } /> }
                                    { (userSettings.volumeSystem >= 50) && <FaVolumeUp className="fa-icon" /> }

                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={ userSettings.volumeSystem }
                                        onChange={ event => processAction('system_volume', Number(event.target.value)) }
                                        onMouseUp={ () => saveRangeSlider('volume') }
                                        onTouchEnd={ () => saveRangeSlider('volume') }
                                    />
                                </Flex>
                            </div>

                            <div className="settings-volume-row">
                                <Text>{ LocalizeText('widget.memenu.settings.volume.furni') }</Text>

                                <Flex alignItems="center" gap={ 1 }>
                                    { (userSettings.volumeFurni === 0) && <FaVolumeMute className="fa-icon" /> }
                                    { (userSettings.volumeFurni > 0) && <FaVolumeDown className={ classNames((userSettings.volumeFurni >= 50) && 'text-muted', 'fa-icon') } /> }
                                    { (userSettings.volumeFurni >= 50) && <FaVolumeUp className="fa-icon" /> }

                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={ userSettings.volumeFurni }
                                        onChange={ event => processAction('furni_volume', Number(event.target.value)) }
                                        onMouseUp={ () => saveRangeSlider('volume') }
                                        onTouchEnd={ () => saveRangeSlider('volume') }
                                    />
                                </Flex>
                            </div>

                            <div className="settings-volume-row">
                                <Text>{ LocalizeText('widget.memenu.settings.volume.trax') }</Text>

                                <Flex alignItems="center" gap={ 1 }>
                                    { (userSettings.volumeTrax === 0) && <FaVolumeMute className="fa-icon" /> }
                                    { (userSettings.volumeTrax > 0) && <FaVolumeDown className={ classNames((userSettings.volumeTrax >= 50) && 'text-muted', 'fa-icon') } /> }
                                    { (userSettings.volumeTrax >= 50) && <FaVolumeUp className="fa-icon" /> }

                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={ userSettings.volumeTrax }
                                        onChange={ event => processAction('trax_volume', Number(event.target.value)) }
                                        onMouseUp={ () => saveRangeSlider('volume') }
                                        onTouchEnd={ () => saveRangeSlider('volume') }
                                    />
                                </Flex>
                            </div>
                        </Column>
                    }

                    { activeTab === 'video' &&
                        <Column gap={ 2 } className="video-settings-panel">
                            <div className="video-setting-row">
                                <Text>FPS Máximo</Text>

                                <select value={ videoSettings.fpsMax } onChange={ event => updateVideoSetting('fpsMax', Number(event.target.value) as VideoSettings['fpsMax']) }>
                                    <option value={ 0 }>Ilimitado</option>
                                    <option value={ 30 }>30 FPS</option>
                                    <option value={ 60 }>60 FPS</option>
                                    <option value={ 120 }>120 FPS</option>
                                    <option value={ 144 }>144 FPS</option>
                                </select>
                            </div>

                            <div className="video-setting-row">
                                <Text>Qualidade de Escala</Text>

                                <select value={ videoSettings.scaleQuality } onChange={ event => updateVideoSetting('scaleQuality', event.target.value as VideoSettings['scaleQuality']) }>
                                    <option value="quality">Qualidade</option>
                                    <option value="balanced">Equilibrada</option>
                                    <option value="performance">Desempenho</option>
                                </select>
                            </div>

                            <div className="video-setting-row">
                                <Text>Precisão da GPU</Text>

                                <select value={ videoSettings.gpuPrecision } onChange={ event => updateVideoSetting('gpuPrecision', event.target.value as VideoSettings['gpuPrecision']) }>
                                    <option value="high">Alta (Mais Nitidez)</option>
                                    <option value="medium">Média (Compatível)</option>
                                </select>
                            </div>

                            <div className="video-setting-row">
                                <Text>Desempenho</Text>

                                <select value={ videoSettings.performanceMode } onChange={ event => updateVideoSetting('performanceMode', event.target.value as VideoSettings['performanceMode']) }>
                                    <option value="balanced">Equilibrado</option>
                                    <option value="performance">Mais FPS</option>
                                    <option value="quality">Mais Qualidade</option>
                                </select>
                            </div>

                            <div className="video-setting-row">
                                <Text>Fluxo de Dados</Text>

                                <select value={ videoSettings.dataFlow } onChange={ event => updateVideoSetting('dataFlow', event.target.value as VideoSettings['dataFlow']) }>
                                    <option value="instant">Instantânea</option>
                                    <option value="balanced">Equilibrada</option>
                                    <option value="economy">Econômica</option>
                                </select>
                            </div>

                            <div className="video-setting-row">
                                <Text>Estabilidade Gráfica</Text>

                                <select value={ videoSettings.graphicStability } onChange={ event => updateVideoSetting('graphicStability', event.target.value as VideoSettings['graphicStability']) }>
                                    <option value="high_fidelity">Alta Fidelidade</option>
                                    <option value="stable">Estável</option>
                                    <option value="fast">Rápida</option>
                                </select>
                            </div>

                            <label className="settings-check-row">
                                <input type="checkbox" checked={ videoSettings.antialias } onChange={ event => updateVideoSetting('antialias', event.target.checked) } />
                                <span>Antialias (Suavização)</span>
                            </label>

                            <button type="button" className="video-settings-reset" onClick={ resetVideoSettings }>
                                Resetar para Recomendado
                            </button>

                            <Text small className="text-muted">
                                Algumas alterações de vídeo só ficam 100% ativas após atualizar o client.
                            </Text>
                        </Column>
                    }
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
