import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

/**
 * React view for the "Mandar Sinal" wired effect. This effect triggers
 * the WiredTriggerType.STATE_CHANGED on selected furniture items. The
 * creator can choose to send a signal for each selected mobi and/or send
 * a signal for each user currently in the room. These options are
 * represented by two checkboxes. When saved, the int parameters sent to
 * the emulator are [ sendToEachFurniFlag, sendToEachUserFlag ].
 */
export const WiredActionSendSignalView: FC<{}> = props =>
{
    // Local state for the two options
    const [ sendToEachFurni, setSendToEachFurni ] = useState(false);
    const [ sendToEachUser, setSendToEachUser ] = useState(false);

    const { trigger = null, setIntParams = null } = useWired();

    useEffect(() =>
    {
        // Preload existing wired configuration when editing
        if(!trigger) return;

        if(trigger.intData && trigger.intData.length >= 1)
        {
            setSendToEachFurni(trigger.intData[0] === 1);
        }
        if(trigger.intData && trigger.intData.length >= 2)
        {
            setSendToEachUser(trigger.intData[1] === 1);
        }
    }, [ trigger ]);

    const save = () =>
    {
        // Send integer parameters: convert booleans to 1/0
        if(setIntParams) setIntParams([ sendToEachFurni ? 1 : 0, sendToEachUser ? 1 : 0 ]);
    }

    return (
        <WiredActionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID } hasSpecialInput={ true } save={ save }>
            <Column gap={ 1 }>
                <Text bold>Opções de sinal:</Text>
                <Flex alignItems="center" gap={ 1 }>
                    <input type="checkbox" className="form-check-input" checked={ sendToEachFurni } onChange={ e => setSendToEachFurni(e.target.checked) } />
                    <Text>Enviar sinal para cada mobi</Text>
                </Flex>
                <Flex alignItems="center" gap={ 1 }>
                    <input type="checkbox" className="form-check-input" checked={ sendToEachUser } onChange={ e => setSendToEachUser(e.target.checked) } />
                    <Text>Enviar sinal para cada usuário</Text>
                </Flex>
            </Column>
        </WiredActionBaseView>
    );
}
