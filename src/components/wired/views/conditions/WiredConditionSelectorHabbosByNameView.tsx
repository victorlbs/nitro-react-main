import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionSelectorHabbosByNameView: FC<{}> = props => {
    const [names, setNames] = useState<string>('');
    const [filterExisting, setFilterExisting] = useState<boolean>(false);
    const [invert, setInvert] = useState<boolean>(false);
    
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    const save = () => {
        setStringParam(names);
        setIntParams([filterExisting ? 1 : 0, invert ? 1 : 0]);
    };

    useEffect(() => {
        if (!trigger) return;

        setNames(trigger.stringData || '');
        setFilterExisting(trigger.intData.length > 0 && trigger.intData[0] === 1);
        setInvert(trigger.intData.length > 1 && trigger.intData[1] === 1);
    }, [trigger]);

    return (
        <WiredConditionBaseView requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} hasSpecialInput={true} save={save}>
            <Column gap={1} className="w-100">
                
                {/* CAMPO DE NOMES */}
                <Column gap={1}>
                    <Text bold>Digite os nomes:</Text>
                    <textarea 
                        className="form-control" 
                        rows={6}
                        value={names}
                        onChange={e => setNames(e.target.value)}
                        placeholder="Separe os nomes por quebra de linha ou vírgula"
                        style={{ resize: 'none' }}
                    />
                </Column>

                <hr className="m-0 bg-dark" />

                {/* OPÇÕES DO SELETOR */}
                <Column gap={1}>
                    <Text bold>Opções do seletor:</Text>
                    
                    <Flex alignItems="center" gap={1}>
                        <input 
                            type="checkbox" 
                            className="form-check-input" 
                            checked={filterExisting} 
                            onChange={e => setFilterExisting(e.target.checked)} 
                        />
                        <Text>Filtrar seleção existente</Text>
                    </Flex>
                    
                    <Flex alignItems="center" gap={1}>
                        <input 
                            type="checkbox" 
                            className="form-check-input" 
                            checked={invert} 
                            onChange={e => setInvert(e.target.checked)} 
                        />
                        <Text>Inverter</Text>
                    </Flex>
                </Column>

            </Column>
        </WiredConditionBaseView>
    );
}
