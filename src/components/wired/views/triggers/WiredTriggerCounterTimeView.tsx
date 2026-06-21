import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

/**
 * React view for the custom wired trigger that activates when a selected game timer
 * (cronômetro) reaches a chosen amount of time (minutes and seconds). The user
 * may select up to 20 timer furniture and optionally decide whether the trigger
 * should apply to any timer ("Qualquer mobi") or only to those selected in the
 * editor ("Apenas mobis selecionados"). Advanced options can be toggled via a
 * link to keep the UI compact by default.
 */
export const WiredTriggerCounterTimeView: FC<{}> = () =>
{
    // Local state for minutes and seconds
    const [ minutes, setMinutes ] = useState(0);
    const [ seconds, setSeconds ] = useState(0);
    // Selection mode: 0 = only selected timers, 1 = any timer in the room
    const [ selectionMode, setSelectionMode ] = useState(0);
    // Whether to display advanced configuration options
    const [ showAdvanced, setShowAdvanced ] = useState(false);

    const { trigger = null, setIntParams = null } = useWired();

    // When editing an existing wired, pre-fill the values from the stored intData
    useEffect(() =>
    {
        if (!trigger) return;
        const data = trigger.intData;
        if (Array.isArray(data) && data.length >= 2)
        {
            setMinutes(parseInt(data[0]) || 0);
            setSeconds(parseInt(data[1]) || 0);
            if (data.length >= 3) setSelectionMode(parseInt(data[2]) || 0);
        }
    }, [ trigger ]);

    // Save function commits the configuration back to the emulator
    const save = () =>
    {
        if (setIntParams)
        {
            setIntParams([
                minutes,
                seconds,
                selectionMode
            ]);
        }
    };

    // Helper to constrain a numeric value between min and max
    const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

    return (
        <WiredTriggerBaseView hasSpecialInput={ true } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID } save={ save }>
            <Column gap={ 2 }>
                {/* Time selection */}
                <Column gap={ 1 }>
                    <Text bold>Tempo escolhido</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <Text>Minutos:</Text>
                        <input type="number" min={ 0 } max={ 59 } value={ minutes } onChange={ e => setMinutes(clamp(parseInt(e.target.value) || 0, 0, 59)) } style={{ width: '60px' }} />
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <Text>Segundos:</Text>
                        <input type="number" min={ 0 } max={ 59 } value={ seconds } onChange={ e => setSeconds(clamp(parseInt(e.target.value) || 0, 0, 59)) } style={{ width: '60px' }} />
                    </Flex>
                </Column>

                {/* Link to toggle advanced options */}
                <Text className="text-primary" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={ () => setShowAdvanced(prev => !prev) }>
                    { showAdvanced ? 'Ocultar configurações avançadas' : 'Mostrar configurações avançadas' }
                </Text>

                {/* Advanced configuration: selection mode */}
                { showAdvanced && (
                    <Column gap={ 1 }>
                        <Text bold>Modo de seleção</Text>
                        <Flex alignItems="center" gap={ 1 }>
                            <input type="radio" id="selection-only" name="selectionMode" checked={ selectionMode === 0 } onChange={ () => setSelectionMode(0) } />
                            <label htmlFor="selection-only">Apenas mobis selecionados</label>
                        </Flex>
                        <Flex alignItems="center" gap={ 1 }>
                            <input type="radio" id="selection-any" name="selectionMode" checked={ selectionMode === 1 } onChange={ () => setSelectionMode(1) } />
                            <label htmlFor="selection-any">Qualquer mobi</label>
                        </Flex>
                    </Column>
                ) }
            </Column>
        </WiredTriggerBaseView>
    );
};
