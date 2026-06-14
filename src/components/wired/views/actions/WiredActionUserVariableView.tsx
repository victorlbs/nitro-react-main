import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api/wired/WiredFurniType';
import { useWired } from '../../../../hooks/wired';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionUserVariableView: FC = () => {
    // Adicionamos o setIntParams no hook para salvar as opções de disponibilidade
    const { trigger, setStringParam, setIntParams } = useWired();
    
    const [variableName, setVariableName] = useState<string>('');
    const [hasValue, setHasValue] = useState<boolean>(false);
    const [variableValue, setVariableValue] = useState<string>('');
    const [availability, setAvailability] = useState<number>(0);

    // Carrega os dados do Wired quando a janela é aberta
    useEffect(() => {
        if (trigger) {
            // Separa a string: "nome;valor"
            const stringData = trigger.stringData || '';
            const textParts = stringData.split(';');
            setVariableName(textParts[0] || '');

            // Pega as configurações de Int (Checkbox e Radio Buttons)
            if (trigger.intData && trigger.intData.length >= 2) {
                const valCheckbox = trigger.intData[0] === 1;
                setHasValue(valCheckbox);
                setAvailability(trigger.intData[1]);

                if (valCheckbox && textParts.length > 1) {
                    setVariableValue(textParts[1] || '');
                } else {
                    setVariableValue('');
                }
            } else {
                setHasValue(false);
                setAvailability(0);
                setVariableValue('');
            }
        }
    }, [trigger]);

    // Funções para salvar no emulador sempre que houver alteração
    const updateStringData = (newVarName: string, newHasValue: boolean, newVarValue: string) => {
        const combinedString = newHasValue ? `${newVarName};${newVarValue}` : newVarName;
        if (setStringParam) setStringParam(combinedString);
    };

    const updateIntData = (newHasValue: boolean, newAvailability: number) => {
        if (setIntParams) setIntParams([newHasValue ? 1 : 0, newAvailability]);
    };

    // Handlers de input
    const handleVarNameChange = (val: string) => {
        setVariableName(val);
        updateStringData(val, hasValue, variableValue);
    };

    const handleHasValueChange = (checked: boolean) => {
        setHasValue(checked);
        updateStringData(variableName, checked, variableValue);
        updateIntData(checked, availability);
    };

    const handleVarValueChange = (val: string) => {
        setVariableValue(val);
        updateStringData(variableName, hasValue, val);
    };

    const handleAvailabilityChange = (val: number) => {
        setAvailability(val);
        updateIntData(hasValue, val);
    };

    return (
        <WiredActionBaseView 
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} 
            hasSpecialInput={true} 
        >
            <div className="d-flex flex-column gap-2">
                <div className="d-flex flex-column gap-1">
                    <span className="fw-bold" style={{ fontSize: '12px' }}>Nome da variável:</span>
                    <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        value={variableName} 
                        onChange={(e) => handleVarNameChange(e.target.value)} 
                        maxLength={32} 
                        placeholder="Ex: %variavel%"
                    />
                </div>
                
                <hr className="m-0 border-secondary opacity-50" />

                <div className="d-flex flex-column gap-1">
                    <span className="fw-bold" style={{ fontSize: '12px' }}>Configurações da variável:</span>
                    <div className="d-flex align-items-center gap-1">
                        <input 
                            className="form-check-input mt-0" 
                            type="checkbox" 
                            id="hasValue" 
                            checked={hasValue} 
                            onChange={(e) => handleHasValueChange(e.target.checked)} 
                        />
                        <label className="form-check-label text-muted" htmlFor="hasValue" style={{ fontSize: '12px', cursor: 'pointer' }}>
                            Atribuir um valor
                        </label>
                    </div>
                    {hasValue && (
                        <input 
                            type="text" 
                            className="form-control form-control-sm mt-1" 
                            value={variableValue} 
                            onChange={(e) => handleVarValueChange(e.target.value)} 
                            maxLength={64} 
                            placeholder="Valor da variável"
                        />
                    )}
                </div>

                <hr className="m-0 border-secondary opacity-50" />
                
                <div className="d-flex flex-column gap-1">
                    <span className="fw-bold" style={{ fontSize: '12px' }}>Disponibilidade:</span>
                    
                    <div className="d-flex align-items-center gap-1">
                        <input 
                            className="form-check-input mt-0" 
                            type="radio" 
                            name="availability" 
                            id="avail0"
                            checked={availability === 0} 
                            onChange={() => handleAvailabilityChange(0)} 
                        />
                        <label className="form-check-label text-muted" htmlFor="avail0" style={{ fontSize: '12px', cursor: 'pointer' }}>
                            Apenas na sessão atual do quarto
                        </label>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                        <input 
                            className="form-check-input mt-0" 
                            type="radio" 
                            name="availability"
                            id="avail1" 
                            checked={availability === 1} 
                            onChange={() => handleAvailabilityChange(1)} 
                        />
                        <label className="form-check-label text-muted" htmlFor="avail1" style={{ fontSize: '12px', cursor: 'pointer' }}>
                            Permanente neste quarto (Salvo no banco)
                        </label>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                        <input 
                            className="form-check-input mt-0" 
                            type="radio" 
                            name="availability"
                            id="avail2" 
                            checked={availability === 2} 
                            onChange={() => handleAvailabilityChange(2)} 
                        />
                        <label className="form-check-label text-muted" htmlFor="avail2" style={{ fontSize: '12px', cursor: 'pointer' }}>
                            Global Permanente (Salvo no banco)
                        </label>
                    </div>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
