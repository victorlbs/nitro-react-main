import { FC, useEffect, useState } from 'react';
import ReactSlider from 'react-slider';
import { WiredFurniType } from '../../../../api';
import { Column, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

export const WiredTriggerTempoEscolhidoView: FC<{}> = props =>
{
    const [ minutos, setMinutos ] = useState(0);
    const [ segundos, setSegundos ] = useState(0);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([ minutos, segundos ]);

    useEffect(() =>
    {
        // Se o trigger já tiver dados salvos (minutos no índice 0, segundos no índice 1)
        if (trigger && trigger.intData && trigger.intData.length >= 2) {
            setMinutos(trigger.intData[0]);
            setSegundos(trigger.intData[1]);
        } else {
            setMinutos(0);
            setSegundos(0);
        }
    }, [ trigger ]);

    return (
        <WiredTriggerBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <Column gap={ 2 }>
                {/* SLIDER MINUTOS */}
                <Column gap={ 1 }>
                    <Text bold>Minutos: { minutos }</Text>
                    <ReactSlider
                        className={ 'nitro-slider' }
                        min={ 0 }
                        max={ 60 }
                        value={ minutos }
                        onChange={ event => setMinutos(event) } />
                </Column>

                {/* SLIDER SEGUNDOS */}
                <Column gap={ 1 }>
                    <Text bold>Segundos: { segundos }</Text>
                    <ReactSlider
                        className={ 'nitro-slider' }
                        min={ 0 }
                        max={ 59 }
                        value={ segundos }
                        onChange={ event => setSegundos(event) } />
                </Column>
            </Column>
        </WiredTriggerBaseView>
    );
}
