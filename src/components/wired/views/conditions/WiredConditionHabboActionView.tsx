import { FC, useEffect, useState } from 'react';
import { WiredConditionBaseView } from './WiredConditionBaseView';

export const WiredConditionHabboActionView: FC<{}> = props => {
    const [actionId, setActionId] = useState<number>(0);
    const { trigger = null, setIntParams = null } = useWiredContext();

    useEffect(() => {
        if (trigger && trigger.intData && trigger.intData.length > 0) {
            setActionId(trigger.intData[0]);
        } else {
            setActionId(0);
        }
    }, [trigger]);

    const handleActionChange = (id: number) => {
        setActionId(id);
        setIntParams([id]);
    };

    return (
        <WiredConditionBaseView requiresUser={true} hasSpecialInput={true} info="O Wired será executado apenas se o Habbo que disparou o gatilho estiver realizando a ação selecionada abaixo.">
            <div className="flex flex-col gap-2 mt-2 font-text text-sm">
                <span className="font-bold text-black dark:text-white">Ação Requerida:</span>
                
                {[
                    { id: 0, label: 'Andando' },
                    { id: 1, label: 'Sentado' },
                    { id: 2, label: 'Deitado' },
                    { id: 3, label: 'Dançando' },
                    { id: 4, label: 'Segurando Placa' }
                ].map((action) => (
                    <label key={action.id} className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300 select-none">
                        <input 
                            type="radio" 
                            name="habbo_action_id" 
                            checked={actionId === action.id} 
                            onChange={() => handleActionChange(action.id)}
                            className="cursor-pointer accent-amber-500"
                        />
                        <span>{action.label}</span>
                    </label>
                ))}
            </div>
        </WiredConditionBaseView>
    );
};
