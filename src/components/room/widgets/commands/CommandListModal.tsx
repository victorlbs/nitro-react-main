import { FC } from 'react';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../common/card'; // Ajuste o path

export const CommandListModal: FC<{ commands: { name: string, desc: string }[] }> = ({ commands }) => {
    return (
        <NitroCardView theme="primary" className="w-96">
            <NitroCardHeaderView headerText="Comandos Disponíveis" onCloseClick={() => { /* Fechar logica */ }} />
            <NitroCardContentView>
                <div className="grid grid-cols-1 gap-2 p-2">
                    {commands.map((cmd, index) => (
                        <div key={index} className="flex justify-between p-2 bg-gray-800 rounded border border-gray-700 hover:bg-gray-700 transition">
                            <span className="font-bold text-blue-400">{cmd.name}</span>
                            <span className="text-gray-400 text-sm">{cmd.desc}</span>
                        </div>
                    ))}
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
