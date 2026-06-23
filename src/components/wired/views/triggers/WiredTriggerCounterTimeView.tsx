import { FC, useEffect, useState } from 'react';
import ReactSlider from 'react-slider';
import { WiredFurniType } from '../../../../api';
import { Column, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

const MAX_MINUTES = 99;
const MAX_SECONDS = 59;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const WiredTriggerCounterTimeView: FC<{}> = () =>
{
    const [ minutes, setMinutes ] = useState(0);
    const [ seconds, setSeconds ] = useState(0);
    const [ selectionMode, setSelectionMode ] = useState(0);
    const [ showAdvanced, setShowAdvanced ] = useState(false);

    const { trigger = null, setIntParams = null } = useWired();

    useEffect(() =>
    {
        if(!trigger) return;

        if(trigger.intData && trigger.intData.length >= 2)
        {
            setMinutes(clamp(Number(trigger.intData[0]) || 0, 0, MAX_MINUTES));
            setSeconds(clamp(Number(trigger.intData[1]) || 0, 0, MAX_SECONDS));
            setSelectionMode((trigger.intData.length >= 3 && Number(trigger.intData[2]) === 1) ? 1 : 0);
        }
        else
        {
            setMinutes(0);
            setSeconds(0);
            setSelectionMode(0);
        }
    }, [ trigger ]);

    const save = () =>
    {
        if(setIntParams) setIntParams([
            clamp(minutes, 0, MAX_MINUTES),
            clamp(seconds, 0, MAX_SECONDS),
            selectionMode === 1 ? 1 : 0
        ]);
    };

    return (
        <WiredTriggerBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID }
            save={ save }>
            <Column gap={ 2 }>
                <Column gap={ 1 }>
                    <Text bold>Passaram { minutes } minuto{ minutes === 1 ? '' : 's' }</Text>
                    <ReactSlider
                        min={ 0 }
                        max={ MAX_MINUTES }
                        value={ minutes }
                        className="nitro-slider"
                        thumbClassName="thumb"
                        trackClassName="track"
                        onChange={ event => setMinutes(clamp(Number(event) || 0, 0, MAX_MINUTES)) } />
                </Column>

                <Column gap={ 1 }>
                    <Text bold>passaram { seconds } segundo{ seconds === 1 ? '' : 's' }</Text>
                    <ReactSlider
                        min={ 0 }
                        max={ MAX_SECONDS }
                        value={ seconds }
                        className="nitro-slider"
                        thumbClassName="thumb"
                        trackClassName="track"
                        onChange={ event => setSeconds(clamp(Number(event) || 0, 0, MAX_SECONDS)) } />
                </Column>

                <Text small className="text-muted">
                    Selecione o cronômetro do jogo. O wired dispara quando esse cronômetro chegar exatamente nesse tempo.
                </Text>

                <Text
                    className="text-primary"
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={ () => setShowAdvanced(value => !value) }>
                    { showAdvanced ? 'Ocultar configurações avançadas' : 'Mostrar configurações avançadas' }
                </Text>

                { showAdvanced &&
                    <Column gap={ 1 }>
                        <Text bold>Modo de seleção</Text>
                        <select
                            className="form-select form-select-sm"
                            value={ selectionMode }
                            onChange={ event => setSelectionMode(Number(event.target.value) === 1 ? 1 : 0) }>
                            <option value={ 0 }>Apenas mobis selecionados</option>
                            <option value={ 1 }>Qualquer cronômetro do quarto</option>
                        </select>
                    </Column> }
            </Column>
        </WiredTriggerBaseView>
    );
};
