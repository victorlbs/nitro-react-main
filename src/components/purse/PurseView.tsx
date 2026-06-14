import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { CreateLinkEvent, GetConfiguration } from '../../api';
import { Column, Flex, Grid } from '../../common';
import { usePurse } from '../../hooks';
import { CurrencyView } from './views/CurrencyView';
import { SeasonalView } from './views/SeasonalView';

export const PurseView: FC<{}> = props =>
{
    const { purse = null, hcDisabled = true } = usePurse();

    const displayedCurrencies = useMemo(() => GetConfiguration<number[]>('system.currency.types', []), []);
    const currencyDisplayNumberShort = useMemo(() => GetConfiguration<boolean>('currency.display.number.short', false), []);

    // --- LÓGICA DA RÁDIO (React Hooks) ---
    const [radioData, setRadioData] = useState({ musica_atual: 'Conectando...', ouvintes_conectados: '0' });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isRadioVisible, setIsRadioVisible] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);

    // 1. Fetch dos dados da Rádio
    useEffect(() => {
        const fetchRadioData = () => {
            fetch('https://painel.streaminghd.net.br/api/json/VG5wQk5VNUJQVDA9KzM=')
                .then(response => response.json())
                .then(data => {
                    setRadioData({
                        musica_atual: data.musica_atual || 'Sem música',
                        ouvintes_conectados: data.ouvintes_conectados || '0'
                    });
                }).catch(err => console.error("Erro na rádio:", err));
        };

        fetchRadioData();
        const interval = setInterval(fetchRadioData, 15000);
        return () => clearInterval(interval);
    }, []);

    // 2. LÓGICA DO AUTOPLAY (Gatilho no primeiro clique)
    useEffect(() => {
        const attemptAutoplay = () => {
            if (audioRef.current && audioRef.current.paused) {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    // Sucesso! Removemos o "espião" de cliques para otimizar o cliente
                    document.removeEventListener('click', attemptAutoplay);
                    document.removeEventListener('keydown', attemptAutoplay);
                }).catch(e => {
                    // O navegador ainda está a bloquear, aguarda o próximo clique do utilizador
                });
            }
        };

        // Escuta o ecrã inteiro. Qualquer clique aciona a rádio.
        document.addEventListener('click', attemptAutoplay);
        document.addEventListener('keydown', attemptAutoplay);

        return () => {
            document.removeEventListener('click', attemptAutoplay);
            document.removeEventListener('keydown', attemptAutoplay);
        };
    }, []);

    // 3. Função do botão manual
    const toggleRadio = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.warn("Aguardando interação", e));
            }
            setIsPlaying(!isPlaying);
        }
    };
    // -------------------------------------

    const getCurrencyElements = (offset: number, limit: number = -1, seasonal: boolean = false) =>
    {
        if(!purse || !purse.activityPoints || !purse.activityPoints.size) return null;
        const types = Array.from(purse.activityPoints.keys()).filter(type => (displayedCurrencies.indexOf(type) >= 0));
        let count = 0;

        while(count < offset)
        {
            types.shift();
            count++;
        }

        count = 0;
        const elements: JSX.Element[] = [];

        for(const type of types)
        {
            if((limit > -1) && (count === limit)) break;
            if(type === 105) continue; // Ignora moeda customizada

            if(seasonal) elements.push(<SeasonalView key={ type } type={ type } amount={ purse.activityPoints.get(type) } />);
            else elements.push(<CurrencyView key={ type } type={ type } amount={ purse.activityPoints.get(type) } short={ currencyDisplayNumberShort } />);

            count++;
        }

        return elements;
    }

    if(!purse) return null;

    const estrelasBalance = purse.activityPoints.get(105) || 0;

    return (
        <Column alignItems="end" className="nitro-purse-container" gap={ 1 }>
            
            {/* O ÁUDIO DEVE FICAR FORA DO CONDICIONAL PARA NÃO PARAR DE TOCAR */}
            <audio ref={audioRef} src="https://stm3.streaminghd.net.br:7094/;" preload="none" style={{ display: 'none' }}></audio>

            <Flex className="nitro-purse rounded-bottom p-1">
                <Grid fullWidth gap={ 1 }>
                    <Column justifyContent="center" size={ 10 } gap={ 0 }>
                        <CurrencyView type={ -1 } amount={ purse.credits } short={ currencyDisplayNumberShort } />
                        { getCurrencyElements(0, 2) }
                    </Column>
                    
                    <Column justifyContent="center" size={ 2 } gap={ 0 }>
                        <Flex center pointer fullHeight className="nitro-purse-button p-1 rounded" onClick={ event => CreateLinkEvent('help/show') }>
                            <i className="icon icon-help"/>
                        </Flex>
                        <Flex center pointer fullHeight className="nitro-purse-button p-1 rounded" onClick={ event => CreateLinkEvent('user-settings/toggle') } >
                            <i className="icon icon-cog"/>
                        </Flex>
                    </Column>
                </Grid>
            </Flex>
            { getCurrencyElements(2, -1, true) }

            {/* --- BOX CUSTOMIZADA: ESTRELAS --- */}
            <Flex alignItems="center" justifyContent="between" className="nitro-purse custom-star-box rounded p-1 w-100">
                <span className="text-white fw-bold ms-1" style={{ fontSize: '12px' }}>Estrelas: {estrelasBalance}</span>
                <Flex alignItems="center" gap={ 2 }>
                    <span 
                        className="text-white fw-bold text-decoration-underline cursor-pointer" 
                        style={{ fontSize: '11px' }}
                        onClick={ () => CreateLinkEvent('catalog/open/estrelas') }
                    >
                        Info
                    </span>
                    <Flex center className="rounded" style={{ backgroundColor: '#3ca8d1', padding: '3px 4px' }}>
                        <img 
                            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj-li7sTVVtljHje3iBct_1ssweJq8Dw7FCfKLXuF_quv6tU0-nxQx1AS2IHNBNHDKZQVEQX-q1t6WNfKW6OaS3pJivBjkzP4FsL9A-NDX-SZo6RLdfxdTMhIcq05Onagm3mxhl9896TtTz/s1600/Estrela1.png" 
                            alt="Estrela" 
                            style={{ width: '14px', height: '14px', objectFit: 'contain' }} 
                        />
                    </Flex>
                </Flex>
            </Flex>
            {/* ---------------------------------- */}

            {/* --- BOX DA RÁDIO INTEGRADA COM BOTÃO OCULTAR E AUTOPLAY --- */}
            <Flex className="nitro-purse rounded p-2 w-100" flexDirection="column" gap={ 1 } style={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #444', transition: 'all 0.3s ease' }}>
                
                {/* Cabeçalho da Rádio - Sempre Visível */}
                <Flex alignItems="center" justifyContent="between" className="w-100">
                    <span className="text-white fw-bold ms-1" style={{ fontSize: '10px' }}> Rádio</span>
                    
                    <Flex alignItems="center" gap={ 2 }>
                    
                        
                        <span 
                            className="text-white fw-bold cursor-pointer ms-1" 
                            style={{ fontSize: '14px', padding: '0 4px', userSelect: 'none' }}
                            onClick={() => setIsRadioVisible(!isRadioVisible)}
                            title={isRadioVisible ? "Ocultar Rádio" : "Mostrar Rádio"}
                        >
                            {isRadioVisible ? '–' : '+'}
                        </span>
                    </Flex>
                </Flex>
                
                {/* Corpo da Rádio - Ocultável */}
                {isRadioVisible && (
                    <>
                      
                        <Flex 
                            center 
                            pointer 
                            className="rounded text-white fw-bold mt-1" 
                            onClick={toggleRadio}
                            style={{ backgroundColor: isPlaying ? '#d32f2f' : '#388e3c', padding: '4px 0', fontSize: '11px', transition: 'background 0.2s' }}
                        >
                            {isPlaying ? 'Desligar' : 'Ligar'}
                        </Flex>
                    </>
                )}
            </Flex>
            {/* ---------------------------------- */}

        </Column>
    );
}
