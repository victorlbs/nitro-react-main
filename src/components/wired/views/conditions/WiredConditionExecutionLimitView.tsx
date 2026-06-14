import { FC, useEffect, useState } from 'react';
import { useWired } from '../../../../hooks/wired';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionExecutionLimitView: FC = () => {
    const { trigger, setIntParams } = useWired();
    const [limitType, setLimitType] = useState<number>(0);
    const [cooldownTicks, setCooldownTicks] = useState<number>(0);
    const [executionLimit, setExecutionLimit] = useState<number>(0);

    useEffect(() => {
        if (trigger && trigger.intData && trigger.intData.length >= 3) {
            setLimitType(trigger.intData[0]);
            setCooldownTicks(trigger.intData[1]);
            setExecutionLimit(trigger.intData[2]);
        } else {
            setLimitType(0);
            setCooldownTicks(0);
            setExecutionLimit(0);
        }
    }, [trigger]);

    const updateData = (type: number, ticks: number, limit: number) => {
        setLimitType(type);
        setCooldownTicks(ticks);
        setExecutionLimit(limit);
        if (setIntParams) setIntParams([type, ticks, limit]);
    };

    // 1 tick no Habbo equivale a 0.5 segundos
    const cooldownSeconds = (cooldownTicks * 0.5).toFixed(1);

    return (
        <WiredConditionBaseView requiresFurni={0} hasSpecialInput={true}>
            <div className="d-flex flex-column gap-2">
                <div className="d-flex flex-column gap-1">
                    <span className="text-black">Extra: Limite de Execução</span>
                    <span className="text-black" style={{ fontSize: '12px' }}>
                        Escolha uma limitação de execução para a pilha em que este Wired está posicionado. Este Wired deve ser o mais alto de todos os Wireds nesta pilha.
                    </span>
                </div>
                
                <hr className="m-0 border-secondary opacity-50" />

                <div className="d-flex flex-column gap-1">
                    <div className="d-flex align-items-center gap-1">
                        <input 
                            className="form-check-input mt-0 text-black" 
                            type="radio" 
                            id="limitUser"
                            checked={limitType === 0} 
                            onChange={() => updateData(0, cooldownTicks, executionLimit)} 
                        />
                        <label className="form-check-label text-black cursor-pointer" htmlFor="limitUser" style={{ fontSize: '12px' }}>
                            Definir limite pela unidade (habbo) acionador
                        </label>
                    </div>

                    <div className="d-flex align-items-center gap-1 text-black">
                        <input 
                            className="form-check-input mt-0" 
                            type="radio" 
                            id="limitGlobal"
                            checked={limitType === 1} 
                            onChange={() => updateData(1, cooldownTicks, executionLimit)} 
                        />
                        <label className="form-check-label text-black cursor-pointer" htmlFor="limitGlobal" style={{ fontSize: '12px' }}>
                            Definir limite global
                        </label>
                    </div>
                </div>

                <hr className="m-0 border-secondary opacity-50" />

                <div className="d-flex flex-column gap-1 text-black">
                    <span className="text-black" style={{ fontSize: '12px' }}>Tempo para um novo acionamento (em segundos): {cooldownSeconds}</span>
                    <input 
                        type="range" 
                        className="form-range" 
                        min="0" 
                        max="120" // Equivalente a 60 Segundos
                        step="1"
                        value={cooldownTicks} 
                        onChange={(e) => updateData(limitType, parseInt(e.target.value), executionLimit)} 
                    />
                </div>

                <div className="d-flex flex-column gap-1 mt-1">
                    <span className="text-black " style={{ fontSize: '12px' }}>Vezes de execução por limitação (0 = Sem limite):</span>
                    <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        min="0"
                        value={executionLimit} 
                        onChange={(e) => updateData(limitType, parseInt(e.target.value) || 0, executionLimit)} 
                    />
                </div>
            </div>
        </WiredConditionBaseView>
    );
};
