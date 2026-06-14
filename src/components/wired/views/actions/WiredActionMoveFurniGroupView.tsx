import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api/wired/WiredFurniType';
import { useWired } from '../../../../hooks/wired';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionMoveFurniGroupView: FC = () => {
    const { trigger, setIntParams } = useWired();
    const [offsetX, setOffsetX] = useState<number>(0);
    const [offsetY, setOffsetY] = useState<number>(0);
    const [targetSource, setTargetSource] = useState<number>(0);

    const save = () => {
        setIntParams([offsetX, offsetY, targetSource]);
    };

    useEffect(() => {
        if (trigger && trigger.intData.length >= 3) {
            setOffsetX(trigger.intData[0]);
            setOffsetY(trigger.intData[1]);
            setTargetSource(trigger.intData[2]);
        } else {
            setOffsetX(0);
            setOffsetY(0);
            setTargetSource(0);
        }
    }, [trigger]);

    const targetOptions = [
        'Posição do Usuário',
        'Posição deste Wired'
    ];

    const cycleTarget = (direction: number) => {
        let newIndex = targetSource + direction;
        if (newIndex < 0) newIndex = targetOptions.length - 1;
        if (newIndex >= targetOptions.length) newIndex = 0;
        setTargetSource(newIndex);
    };

    return (
        <WiredActionBaseView 
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_BY_ID_BY_TYPE_OR_FROM_CONTEXT} 
            hasSpecialInput={true} 
            saveAction={save}
        >
            <div className="d-flex flex-column gap-2">
                <span className="fw-bold">Configuração de Movimento</span>
                <span className="text-muted" style={{ fontSize: '12px' }}>
                    Mova um grupo de mobis selecionados para um local de destino mantendo a formação.
                </span>
                
                <hr className="m-0 border-secondary opacity-50" />

                <div className="d-flex flex-column gap-1">
                    <span className="fw-bold">Deslocamento (Opcional):</span>
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center gap-1">
                            <span className="fw-bold">X:</span>
                            <input 
                                type="number" 
                                className="form-control form-control-sm" 
                                style={{ width: '60px' }}
                                value={offsetX} 
                                onChange={(e) => setOffsetX(Number(e.target.value))} 
                            />
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <span className="fw-bold">Y:</span>
                            <input 
                                type="number" 
                                className="form-control form-control-sm" 
                                style={{ width: '60px' }}
                                value={offsetY} 
                                onChange={(e) => setOffsetY(Number(e.target.value))} 
                            />
                        </div>
                    </div>
                </div>

                <hr className="m-0 border-secondary opacity-50" />
                
                <div className="d-flex flex-column gap-1">
                    <span className="fw-bold">Local de Destino (Âncora):</span>
                    <div className="d-flex align-items-center justify-content-between p-1 rounded text-black" style={{ backgroundColor: '#e9ecef' }}>
                        <button className="btn btn-sm btn-dark px-2 py-0" onClick={() => cycleTarget(-1)}>&lt;</button>
                        <span className="fw-bold text-center w-100" style={{ fontSize: '12px' }}>
                            {targetOptions[targetSource]}
                        </span>
                        <button className="btn btn-sm btn-dark px-2 py-0" onClick={() => cycleTarget(1)}>&gt;</button>
                    </div>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
