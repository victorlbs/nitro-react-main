import { FC, useEffect, useState } from 'react';
import { Flex, Text } from '../../../../common';
import { WiredConditionBaseView } from './WiredConditionBaseView';
import { WiredConditionLayoutView } from './WiredConditionLayoutView';

export const WiredConditionUserCountInRoomView: FC<WiredConditionLayoutView> = props => {
    const [ minUsers, setMinUsers ] = useState<number>(1);
    const [ maxUsers, setMaxUsers ] = useState<number>(50);

    // Carrega a quantidade do emulador quando a janela abrir
    useEffect(() => {
        if(props.trigger.intData.length >= 2) {
            setMinUsers(props.trigger.intData[0]);
            setMaxUsers(props.trigger.intData[1]);
        }
    }, [ props.trigger ]);

    // Salva e manda os dois arrays de quantidade pro Backend (salva no WiredSettings do Java)
    const save = () => {
        props.trigger.intData = [ minUsers, maxUsers ];
    };

    return (
        <WiredConditionBaseView { ...props } hasSpecialInput={ true } save={ save }>
            <Flex column gap={ 1 }>
                <Text>Quantidade mínima:</Text>
                <input type="number" className="form-control form-control-sm" value={ minUsers } onChange={ e => setMinUsers(parseInt(e.target.value)) } />
            </Flex>
            <Flex column gap={ 1 } className="mt-2">
                <Text>Quantidade máxima:</Text>
                <input type="number" className="form-control form-control-sm" value={ maxUsers } onChange={ e => setMaxUsers(parseInt(e.target.value)) } />
            </Flex>
        </WiredConditionBaseView>
    );
};
