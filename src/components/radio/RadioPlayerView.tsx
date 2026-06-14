import { FC } from 'react';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useRadioPlayer } from '../../hooks/useRadioPlayer';

export const RadioPlayerView: FC = () => {
    const { isPlaying, togglePlay } = useRadioPlayer('https://stm3.streaminghd.net.br:7094/;');

    return (
        <NitroCardView uniqueKey="radio-player" className="radio-player-widget">
            <NitroCardHeaderView headerText="Rádio STM" />
            <NitroCardContentView>
                <div className="flex items-center justify-between p-2">
                    <button 
                        onClick={togglePlay}
                        className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition"
                    >
                        {isPlaying ? 'Parar' : 'Ouvir Agora'}
                    </button>
                    <div className="text-sm">Status: {isPlaying ? 'Ao Vivo' : 'Offline'}</div>
                </div>
            </NitroCardContentView>
        </NitroCardView>
    );
};
