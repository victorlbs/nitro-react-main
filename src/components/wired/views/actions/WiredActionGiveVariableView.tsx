import { FC, useEffect, useState } from 'react';
import ReactSlider from 'react-slider';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

/**
 * React view for the "Dar Variável" wired effect. This component allows
 * creators to specify a variable name, choose whether to overwrite existing
 * values, set an initial value and decide whether the variable should be
 * attached to the triggering user or to selected furniture items. When
 * saved the values are transmitted via setStringParam and setIntParams.
 */
export const WiredActionGiveVariableView: FC<{}> = props =>
{
    const [ variableName, setVariableName ] = useState('');
    const [ replaceExisting, setReplaceExisting ] = useState(false);
    const [ initialValue, setInitialValue ] = useState(0);
    const [ targetType, setTargetType ] = useState(0);

    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    useEffect(() =>
    {
        // Load existing wired configuration when editing a saved effect
        if(!trigger) return;
        // stringData holds the variable name
        setVariableName(trigger.stringData || '');
        // intData[0] = replaceExisting flag (0/1)
        setReplaceExisting((trigger.intData && trigger.intData.length > 0) ? (trigger.intData[0] === 1) : false);
        // intData[1] = initial value
        setInitialValue((trigger.intData && trigger.intData.length > 1) ? trigger.intData[1] : 0);
        // intData[2] = target type
        setTargetType((trigger.intData && trigger.intData.length > 2) ? trigger.intData[2] : 0);
    }, [ trigger ]);

    const save = () =>
    {
        if(setStringParam) setStringParam(variableName);
        if(setIntParams) setIntParams([ replaceExisting ? 1 : 0, initialValue, targetType ]);
    }

    return (
        <WiredActionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID } hasSpecialInput={ true } save={ save }>
            <Column gap={ 1 }>
                <Text bold>Variável</Text>
                <input type="text" className="form-control form-control-sm" value={ variableName } onChange={ e => setVariableName(e.target.value) } placeholder="Nome da variável" />
                <Flex alignItems="center" gap={ 1 }>
                    <input className="form-check-input" type="checkbox" checked={ replaceExisting } onChange={ e => setReplaceExisting(e.target.checked) } />
                    <Text>Substituir variável existente</Text>
                </Flex>
                <Text bold>Valor inicial</Text>
                <ReactSlider
                    className={ 'nitro-slider' }
                    min={ -1000 }
                    max={ 1000 }
                    value={ initialValue }
                    onChange={ (value: number) => setInitialValue(value) }
                />
                <input type="number" className="form-control form-control-sm" value={ initialValue } onChange={ e => setInitialValue(Number(e.target.value)) } />
                <Text bold>Variável de destino</Text>
                <Flex gap={ 1 }>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="targetUser" name="variableTarget" value={ 0 } checked={ targetType === 0 } onChange={ () => setTargetType(0) } />
                        <Text htmlFor="targetUser">Usuário acionador</Text>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="targetFurni" name="variableTarget" value={ 1 } checked={ targetType === 1 } onChange={ () => setTargetType(1) } />
                        <Text htmlFor="targetFurni">Mobi(s) selecionado(s)</Text>
                    </Flex>
                </Flex>
            </Column>
        </WiredActionBaseView>
    );
}
