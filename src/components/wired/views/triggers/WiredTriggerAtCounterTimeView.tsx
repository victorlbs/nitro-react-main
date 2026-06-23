import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

/**
 * Vista para configurar o ativador de cronômetro. Permite definir minutos,
 * segundos e escolher se o trigger deve reagir apenas aos cronômetros
 * selecionados ou a qualquer cronômetro.
 */
export const WiredTriggerCounterTimeView: FC<{}> = () =>
{
    const [ minutes, setMinutes ] = useState(0);
    const [ seconds, setSeconds ] = useState(0);
    const [ selectionMode, setSelectionMode ] = useState(0);
    const [ showAdvanced, setShowAdvanced ] = useState(false);

    const { trigger = null, setIntParams = null } = useWired();

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

    const save = () =>
    {
        if (setIntParams) setIntParams([ minutes, seconds, selectionMode ]);
    };

    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    return (
        <WiredTriggerBaseView hasSpecialInput={ true } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID } save={ save }>
            <Column gap={ 2 }>
                <Column gap={ 1 }>
                    <Text bold>Tempo escolhido</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <Text>Minutos:</Text>
                        <input type="number" min={ 0 } max={ 59 } value={ minutes }
                               onChange={ e => setMinutes(clamp(parseInt(e.target.value) || 0, 0, 59)) }
                               style={{ width: '60px' }} />
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <Text>Segundos:</Text>
                        <input type="number" min={ 0 } max={ 59 } value={ seconds }
                               onChange={ e => setSeconds(clamp(parseInt(e.target.value) || 0, 0, 59)) }
                               style={{ width: '60px' }} />
                    </Flex>
                </Column>

                <Text className="text-primary" style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={ () => setShowAdvanced(prev => !prev) }>
                    { showAdvanced ? 'Ocultar configurações avançadas' : 'Mostrar configurações avançadas' }
                </Text>

                { showAdvanced && (
                    <Column gap={ 1 }>
                        <Text bold>Modo de seleção</Text>
                        <Flex alignItems="center" gap={ 1 }>
                            <input type="radio" id="selection-only" name="selectionMode"
                                   checked={ selectionMode === 0 } onChange={ () => setSelectionMode(0) } />
                            <label htmlFor="selection-only">Apenas mobis selecionados</label>
                        </Flex>
                        <Flex alignItems="center" gap={ 1 }>
                            <input type="radio" id="selection-any" name="selectionMode"
                                   checked={ selectionMode === 1 } onChange={ () => setSelectionMode(1) } />
                            <label htmlFor="selection-any">Qualquer mobi</label>
                        </Flex>
                    </Column>
                ) }
            </Column>
        </WiredTriggerBaseView>
    );
};
