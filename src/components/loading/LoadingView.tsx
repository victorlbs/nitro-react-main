import { FC, useEffect, useState } from 'react';
import { Column, LayoutProgressBar, Text } from '../../common';

interface LoadingViewProps {
    isError: boolean;
    message: string;
    percent: number;
}

// Frases clássicas que aparecem acima da barra (incluindo a da print)
const habboPhrases = [
    "O que veio primeiro? O Pixel ou a Galinha?",
    "Carregando os blocos e construindo...",
    "Acordando os mascotes...",
    "Procurando o Frank...",
    "Polindo os mobis de ouro..."
];

export const LoadingView: FC<LoadingViewProps> = props => {
    const { isError = false, message = '', percent = 0 } = props;
    const [randomPhrase, setRandomPhrase] = useState(habboPhrases[0]);

    useEffect(() => {
        // Seleciona uma frase aleatória ao carregar
        setRandomPhrase(habboPhrases[Math.floor(Math.random() * habboPhrases.length)]);
    }, []);
    
    return (
        <Column fullHeight alignItems="center" justifyContent="center" className="nitro-loading-modern">
            
            {/* 1. Imagem/Logo Central (Substitua a URL pela sua logo) */}
            <div className="loading-logo-container mb-4">
                <img 
                    src="https://habbofont.net/font/paradise_rounded/habbriol.gif" /* Coloque o link da SUA logo do H aqui */
                    alt="Logo do Hotel" 
                    className="loading-logo"
                />
            </div>

            {/* 2. Área da Barra de Progresso e Textos */}
            <div className="progress-container">
                { isError && (message && message.length) ? (
                    <Text className="error-message">{ message }</Text>
                ) : (
                    <>
                        {/* Frase acima da barra */}
                        <Text className="loading-text mb-2">
                            { message || randomPhrase }
                        </Text>
                        
                        {/* Barra de Progresso com novo invólucro */}
                        <div className="modern-progress-wrapper">
                            <LayoutProgressBar progress={ percent } className="modern-bar" />
                        </div>
                        
                        {/* Porcentagem abaixo da barra */}
                        <Text className="loading-percent mt-2">
                            { percent.toFixed() }%
                        </Text>
                    </>
                )}
            </div>

            {/* 3. Versão no canto inferior direito (Igual à imagem) */}
            <Text className="version-text">v3.2.7</Text>
        </Column>
    );
}
