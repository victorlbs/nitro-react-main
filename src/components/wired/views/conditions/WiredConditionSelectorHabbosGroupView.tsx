import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionSelectorHabbosGroupView: FC<{}> = props => {
    const [groupSource, setGroupSource] = useState<number>(0);
    const [limit, setLimit] = useState<number>(5);
    const { trigger = null, setIntParams = null } = useWired();

    const save = () => setIntParams([groupSource, limit]);

    useEffect(() => {
        if (!trigger || trigger.intData.length < 2) return;

        setGroupSource(trigger.intData[0]);
        setLimit(trigger.intData[1]);
    }, [trigger]);

    return (
        <WiredConditionBaseView requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} hasSpecialInput={true} save={save}>
            <Column gap={1} className="w-100">
                
                <Column gap={1}>
                    <Text bold>Selecione a fonte do grupo</Text>
                    <select className="form-select form-select-sm" value={groupSource} onChange={e => setGroupSource(Number(e.target.value))}>
                        <option value={0}>Grupo do mobi</option>
                        <option value={1}>Grupo do usuário ativador</option>
                    </select>
                </Column>
                
                <hr className="m-0 bg-dark" />
                
                <Column gap={1}>
                    <Text bold>Limite a seleção a (Habbos)</Text>
                    <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        value={limit} 
                        min={1} 
                        max={50} 
                        onChange={e => setLimit(Number(e.target.value))} 
                    />
                </Column>

            </Column>
        </WiredConditionBaseView>
    );
}
