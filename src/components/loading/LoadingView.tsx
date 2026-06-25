import { FC, useEffect, useMemo, useState } from 'react';
import { Column, Text } from '../../common';
import './LoadingView.scss';

interface LoadingViewProps {
    isError: boolean;
    message: string;
    percent: number;
}

const loadingPhrases = [
    'Olhe para um lado. Olhe para o outro. Pisque duas vezes. Pronto!',
    'O que veio primeiro? O Pixel ou a Galinha?',
    'Carregando os blocos e construindo...',
    'Acordando os mascotes...',
    'Procurando o Frank...',
    'Polindo os mobis de ouro...',
    'Preparando seu quarto...',
    'Conectando ao hotel...',
    'Arrumando os mobis no lugar...',
    'Chamando seus amigos...'
];

const clampPercent = (value: number): number => {
    if (Number.isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;

    return value;
};

export const LoadingView: FC<LoadingViewProps> = props => {
    const { isError = false, message = '', percent = 0 } = props;

    const [ randomPhrase, setRandomPhrase ] = useState(loadingPhrases[0]);

    const safePercent = useMemo(() => clampPercent(percent), [ percent ]);

    useEffect(() => {
        setRandomPhrase(loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);
    }, []);

    return (
        <Column
            fullHeight
            alignItems="center"
            justifyContent="center"
            className="nitro-loading-habblet"
        >
            <div className="loading-stars" />

            <div className="loading-center">
                <div className="loading-photo-stack">
                    <div className="loading-photo loading-photo-back loading-photo-back-left" />
                    <div className="loading-photo loading-photo-back loading-photo-back-right" />

                    <div className="loading-photo loading-photo-front">
                        <img
                            src="https://cdn.comprahabbo.com/camerabriol/1251_1782230211.png"
                            alt="Habbo"
                            draggable={ false }
                        />

                        <div className="loading-habbo-logo">
                            Habbriol
                        </div>
                    </div>
                </div>
            </div>

            <div className="loading-bottom">
                { isError && message.length > 0 ? (
                    <Text className="loading-error">
                        { message }
                    </Text>
                ) : (
                    <>
                        <Text className="loading-message">
                            { message || randomPhrase }
                        </Text>

                        <div className="loading-progress-outer">
                            <div className="loading-progress-inner">
                                <div
                                    className="loading-progress-fill"
                                    style={{ width: `${ safePercent }%` }}
                                />
                            </div>
                        </div>

                        <Text className="loading-percent">
                            { safePercent.toFixed() }%
                        </Text>
                    </>
                )}
            </div>

            <Text className="loading-version">
                v3.2.7
            </Text>
        </Column>
    );
};
