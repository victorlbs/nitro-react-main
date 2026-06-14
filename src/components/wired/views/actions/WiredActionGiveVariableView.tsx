import { FC, useEffect, useState } from 'react';
import { useWired } from '../../../../hooks/wired';
import { WiredActionBaseView } from './WiredActionBaseView';

const TARGET_SCOPES = [
    "Use o usuário acionador",
    "Use o quarto atual",
    "Use o mobi acionado"
];

export const WiredActionGiveVariableView: FC = () => {
    const { trigger, setStringParam, setIntParams } = useWired();
    const [variableName, setVariableName] = useState<string>('');
    const [initialValue, setInitialValue] = useState<number>(0);
    const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
    const [targetScope, setTargetScope] = useState<number>(0);

    useEffect(() => {
        if (!trigger) return;

        setVariableName(trigger.stringData || '');

        if (trigger.intData && trigger.intData.length >= 3) {
            setInitialValue(trigger.intData[0]);
            setReplaceExisting(trigger.intData[1] === 1);
            setTargetScope(trigger.intData[2]);
        } else {
            setInitialValue(0);
            setReplaceExisting(false);
            setTargetScope(0);
        }
    }, [trigger]);

    const updateStringData = (val: string) => {
        setVariableName(val);
        if (setStringParam) setStringParam(val);
    };

    const updateIntData = (initVal: number, replace: boolean, scope: number) => {
        setInitialValue(initVal);
        setReplaceExisting(replace);
        setTargetScope(scope);
        if (setIntParams) setIntParams([initVal, replace ? 1 : 0, scope]);
    };

    const nextScope = () => {
        const next = (targetScope + 1) % TARGET_SCOPES.length;
        updateIntData(initialValue, replaceExisting, next);
    };

    const prevScope = () => {
        const prev = targetScope === 0 ? TARGET_SCOPES.length - 1 : targetScope - 1;
        updateIntData(initialValue, replaceExisting, prev);
    };

    return (
        <WiredActionBaseView requiresFurni={0} hasSpecialInput={true} hasDelay={true}>
            <div className="d-flex flex-column gap-2">
                
                <div className="d-flex flex-column gap-1">
                    <span className="fw-bold" style={{ fontSize: '13px' }}>Selecione uma variável:</span>
                    <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="Buscar uma variável"
                        value={variableName} 
                        onChange={(e) => updateStringData(e.target.value)} 
                    />
                </div>

                <div className="form-check">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="replaceVariableCheckbox" 
                        checked={replaceExisting} 
                        onChange={(e) => updateIntData(initialValue, e.target.checked, targetScope)} 
                    />
                    <label className="form-check-label" htmlFor="replaceVariableCheckbox" style={{ fontSize: '13px' }}>
                        Substituir variável existente
                    </label>
                </div>

                <hr className="m-0 border-secondary opacity-50" />

                <div className="d-flex flex-column gap-1">
                    <span className="fw-bold" style={{ fontSize: '13px' }}>Opções de valor</span>
                    <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: '13px' }}>Valor inicial:</span>
                        <input 
                            type="number" 
                            className="form-control form-control-sm w-50" 
                            value={initialValue} 
                            onChange={(e) => updateIntData(parseInt(e.target.value) || 0, replaceExisting, targetScope)} 
                        />
                    </div>
                </div>

                <hr className="m-0 border-secondary opacity-50" />

                {/* O slider de delay é injetado automaticamente pelo hasDelay={true} no WiredActionBaseView. Abaixo criamos apenas o escopo final */}

                <div className="d-flex flex-column gap-1 mt-2">
                    <span className="fw-bold" style={{ fontSize: '13px' }}>Variável de destino:</span>
                    <div className="d-flex align-items-center justify-content-between bg-light p-1 rounded border">
                        <i className="icon icon-arrow-left cursor-pointer" onClick={prevScope} />
                        <span style={{ fontSize: '13px' }}>{TARGET_SCOPES[targetScope]}</span>
                        <i className="icon icon-arrow-right cursor-pointer" onClick={nextScope} />
                    </div>
                </div>

            </div>
        </WiredActionBaseView>
    );
};
