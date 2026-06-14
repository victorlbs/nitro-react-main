import { FC, useEffect, useState } from 'react';
import { useWired } from '../../../../hooks/wired';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionVariableFromOtherRoomView: FC = () => {
    const { trigger, setStringParam, setIntParams } = useWired();
    const [variableName, setVariableName] = useState<string>('');
    const [roomId, setRoomId] = useState<string>('');
    const [referenceVariable, setReferenceVariable] = useState<string>('');
    const [readOnly, setReadOnly] = useState<boolean>(false);

    useEffect(() => {
        if (!trigger) return;

        const strParts = (trigger.stringData || '').split('\t');
        setVariableName(strParts[0] || '');
        setReferenceVariable(strParts[1] || '');

        if (trigger.intData && trigger.intData.length >= 2) {
            setRoomId(trigger.intData[0] > 0 ? trigger.intData[0].toString() : '');
            setReadOnly(trigger.intData[1] === 1);
        } else {
            setRoomId('');
            setReadOnly(false);
        }
    }, [trigger]);

    const updateStringData = (vName: string, refVar: string) => {
        setVariableName(vName);
        setReferenceVariable(refVar);
        if (setStringParam) setStringParam(`${vName}\t${refVar}`);
    };

    const updateIntData = (rId: string, rOnly: boolean) => {
        setRoomId(rId);
        setReadOnly(rOnly);
        const parsedRoomId = parseInt(rId) || 0;
        if (setIntParams) setIntParams([parsedRoomId, rOnly ? 1 : 0]);
    };

    return (
        <WiredConditionBaseView requiresFurni={0} hasSpecialInput={true}>
            <div className="d-flex flex-column gap-2">
                <div className="d-flex flex-column gap-1">
                    <span className="text-black" style={{ fontSize: '13px' }}>Nome da variável:</span>
                    <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={variableName} 
                        onChange={(e) => updateStringData(e.target.value, referenceVariable)} 
                    />
                </div>

                <hr className="m-0 border-secondary opacity-50" />

                <div className="d-flex flex-column gap-1">
                    <span className="text-black" style={{ fontSize: '13px' }}>Selecione um quarto:</span>
                    {/* Pode ser um <select> se tiver os dados na API, mantido como text input robusto para IDs */}
                    <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        placeholder="ID do Quarto"
                        value={roomId} 
                        onChange={(e) => updateIntData(e.target.value, readOnly)} 
                    />
                </div>

                <hr className="m-0 border-secondary opacity-50" />

                <div className="d-flex flex-column gap-1">
                    <span className="text-black" style={{ fontSize: '13px' }}>Variável de referência:</span>
                    <select 
                        className="form-select form-select-sm" 
                        value={referenceVariable} 
                        onChange={(e) => updateStringData(variableName, e.target.value)}
                    >
                        <option value="">Escolha uma variável</option>
                        <option value="global_points">Pontos Globais</option>
                        <option value="room_score">Score do Quarto</option>
                        {/* Adicione outras variáveis mapeadas pelo seu backend aqui */}
                    </select>
                </div>

                <hr className="m-0 border-secondary opacity-50" />

                <div className="d-flex flex-column gap-1">
                    <span className="text-black" style={{ fontSize: '13px' }}>Configurações da variável:</span>
                    <div className="form-check">
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="readOnlyCheckbox" 
                            checked={readOnly} 
                            onChange={(e) => updateIntData(roomId, e.target.checked)} 
                        />
                        <label className="form-check-label text-black" htmlFor="readOnlyCheckbox" style={{ fontSize: '13px' }}>
                            Somente leitura
                        </label>
                    </div>
                </div>
            </div>
        </WiredConditionBaseView>
    );
};
