import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api/wired/WiredFurniType';
import { useWired } from '../../../../hooks/wired';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionCheckUserVariableView: FC = () => {
    const { trigger, setStringParam, setIntParams } = useWired();
    
    const [variableName, setVariableName] = useState<string>('');
    const [expectedValue, setExpectedValue] = useState<string>('');
    const [comparisonType, setComparisonType] = useState<number>(0);

    useEffect(() => {
        if (trigger) {
            const stringData = trigger.stringData || '';
            const textParts = stringData.split(';');
            setVariableName(textParts[0] || '');
            setExpectedValue(textParts[1] || '');

            if (trigger.intData && trigger.intData.length > 0) {
                setComparisonType(trigger.intData[0]);
            } else {
                setComparisonType(0);
            }
        }
    }, [trigger]);

    const updateStringData = (name: string, value: string) => {
        if (setStringParam) setStringParam(`${name};${value}`);
    };

    const updateIntData = (compType: number) => {
        if (setIntParams) setIntParams([compType]);
    };

    return (
        <WiredConditionBaseView 
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} 
            hasSpecialInput={true} 
        >
            <div className="d-flex flex-column gap-2">
                <span className="text-black ">Variável do Usuário (Global)</span>
                <span className="text-black" style={{ fontSize: '12px' }}>
                    A condição passará apenas se a variável do jogador corresponder à regra abaixo.
                </span>
                
                <hr className="m-0 border-secondary opacity-50" />

                <div className="d-flex flex-column gap-1">
                    <span className="text-black " style={{ fontSize: '12px' }}>Nome da variável:</span>
                    <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={variableName} 
                        onChange={(e) => {
                            setVariableName(e.target.value);
                            updateStringData(e.target.value, expectedValue);
                        }} 
                        maxLength={32} 
                        placeholder="Ex: %vip%"
                    />
                </div>
                
                <div className="d-flex flex-column gap-1 mt-1">
                    <span className="text-black " style={{ fontSize: '12px' }}>Operador:</span>
                    <select 
                        className="form-select form-select-sm" 
                        value={comparisonType} 
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setComparisonType(val);
                            updateIntData(val);
                        }}
                    >
                        <option value={0}>É igual a</option>
                        <option value={1}>É diferente de</option>
                        <option value={2}>É maior que (Apenas números)</option>
                        <option value={3}>É menor que (Apenas números)</option>
                    </select>
                </div>

                <div className="d-flex flex-column gap-1 mt-1">
                    <span className="text-black " style={{ fontSize: '12px' }}>Valor esperado:</span>
                    <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={expectedValue} 
                        onChange={(e) => {
                            setExpectedValue(e.target.value);
                            updateStringData(variableName, e.target.value);
                        }} 
                        maxLength={64} 
                        placeholder="Ex: 1"
                    />
                </div>
            </div>
        </WiredConditionBaseView>
    );
};
