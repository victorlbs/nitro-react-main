import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

const MOVE_MODE_SELECTED_FURNI: number = 0;
const TARGET_MODE_TRIGGERING_USER: number = 0;

export const WiredActionMoveMobiToHabboView: FC<{}> = () =>
{
    const [ movingFurnitureMode, setMovingFurnitureMode ] = useState(MOVE_MODE_SELECTED_FURNI);
    const [ targetUserMode, setTargetUserMode ] = useState(TARGET_MODE_TRIGGERING_USER);

    const { trigger = null, setIntParams = null } = useWired();

    useEffect(() =>
    {
        if(!trigger) return;

        if(trigger.intData && trigger.intData.length >= 2)
        {
            setMovingFurnitureMode(Number(trigger.intData[0]) || MOVE_MODE_SELECTED_FURNI);
            setTargetUserMode(Number(trigger.intData[1]) || TARGET_MODE_TRIGGERING_USER);
        }
        else
        {
            setMovingFurnitureMode(MOVE_MODE_SELECTED_FURNI);
            setTargetUserMode(TARGET_MODE_TRIGGERING_USER);
        }
    }, [ trigger ]);

    const save = () =>
    {
        if(setIntParams) setIntParams([ movingFurnitureMode, targetUserMode ]);
    };

    const cycleMovingFurnitureMode = () =>
    {
        setMovingFurnitureMode(MOVE_MODE_SELECTED_FURNI);
    };

    const cycleTargetUserMode = () =>
    {
        setTargetUserMode(TARGET_MODE_TRIGGERING_USER);
    };

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID }
            save={ save }>
            <Column gap={ 2 }>
               

            

                <Text small className="text-black">
                    Este efeito move até 20 mobis selecionados para a posição atual do Habbo que acionou o Wired.
                </Text>
            </Column>
        </WiredActionBaseView>
    );
};
