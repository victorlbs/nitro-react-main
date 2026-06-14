import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api/wired/WiredFurniType';
import { useWired } from '../../../../hooks/wired';
import { WiredActionBaseView } from './WiredActionBaseView';

export const WiredActionLogMessageView: FC = () => {
    const { trigger, setStringParam } = useWired();
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        if (trigger && trigger.stringData) {
            setMessage(trigger.stringData);
            setStringParam(trigger.stringData);
        } else {
            setMessage('');
            setStringParam('');
        }
    }, [trigger, setStringParam]);

    return (
        <WiredActionBaseView 
            requiresFurni={WiredFurniType.STUFF_SELECTION_OPTION_NONE} 
            hasSpecialInput={true} 
        >
            <div className="d-flex flex-column gap-2">
                <span className="fw-bold">Alerta para o Dono</span>
                <span className="text-muted" style={{ fontSize: '12px' }}>
                    A mensagem abaixo será exibida em uma janela de alerta (pop-up) exclusivamente para o dono do quarto.
                </span>
                
                <hr className="m-0 border-secondary opacity-50" />

                <div className="d-flex flex-column gap-1">
                    <span className="fw-bold" style={{ fontSize: '12px' }}>Texto (Use %user% para o nome do jogador):</span>
                    <textarea 
                        className="form-control form-control-sm" 
                        maxLength={100}
                        rows={3}
                        placeholder="Ex: O usuário %user% invadiu a área VIP!"
                        value={message} 
                        onChange={(e) => {
                            setMessage(e.target.value);
                            setStringParam(e.target.value);
                        }} 
                    />
                </div>
            </div>
        </WiredActionBaseView>
    );
};
