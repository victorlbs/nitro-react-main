// src/components/wired/views/selectors/WiredSelectorFurniInAreaView.tsx
import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api/wired/WiredFurniType';
import { useWired } from '../../../../hooks/wired';
import { WiredActionBaseView } from '../actions/WiredActionBaseView';

export const WiredSelectorFurniInAreaView: FC = () => {
    const { trigger, setIntParams } = useWired();
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [endX, setEndX] = useState(0);
    const [endY, setEndY] = useState(0);
    const [filterExisting, setFilterExisting] = useState(false);
    const [invert, setInvert] = useState(false);

    const save = () => {
        setIntParams([
            startX, startY, endX, endY, 
            filterExisting ? 1 : 0, 
            invert ? 1 : 0
        ]);
    };

    useEffect(() => {
        if (trigger.intData.length >= 6) {
            setStartX(trigger.intData[0]);
            setStartY(trigger.intData[1]);
            setEndX(trigger.intData[2]);
            setEndY(trigger.intData[3]);
            setFilterExisting(trigger.intData[4] === 1);
            setInvert(trigger.intData[5] === 1);
        }
    }, [trigger]);

    return (
        <WiredActionBaseView requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} hasSpecialInput={true} saveAction={save}>
            <div className="flex flex-col gap-2">
                <span className="font-bold text-sm">Seleção de Área</span>
                <span className="text-xs">Para escolher uma área, basta clicar no botão "Selecionar área" e pressionar e arrastar o cursor para marcar a área desejada dentro do quarto.</span>
                
                <div className="flex gap-2 mt-2">
                    <button className="btn btn-primary w-full" onClick={() => {/* Aciona lógica do RoomEngine/WiredSelectionVisualizer */}}>
                        Selecione a área
                    </button>
                    <button className="btn btn-secondary w-full" onClick={() => { setStartX(0); setStartY(0); setEndX(0); setEndY(0); }}>
                        Limpar
                    </button>
                </div>

                <span className="font-bold text-sm mt-3">Opções do seletor:</span>
                <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="form-checkbox" checked={filterExisting} onChange={(e) => setFilterExisting(e.target.checked)} />
                        <span className="text-xs">Filtrar seleção existente</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="form-checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
                        <span className="text-xs">Inverter</span>
                    </label>
                </div>
            </div>
        </WiredActionBaseView>
    );
};
