import { FC, MouseEvent, useEffect, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { Base, Flex, Grid, NitroCardContentView, Text } from '../../../../common'; // Certifique-se de que o Text está importado

interface ChatInputStyleSelectorViewProps
{
    chatStyleId: number;
    chatStyleIds: number[];
    selectChatStyleId: (styleId: number) => void;
    // NOVO: Propriedades para gerenciar o tamanho do texto
    chatTextSize?: string;
    setChatTextSize?: (size: string) => void;
}

export const ChatInputStyleSelectorView: FC<ChatInputStyleSelectorViewProps> = props =>
{
    // Adicionamos os novos props de tamanho de texto com um valor padrão 'M'
    const { chatStyleId = 0, chatStyleIds = null, selectChatStyleId = null, chatTextSize = 'M', setChatTextSize = null } = props;
    const [ target, setTarget ] = useState<(EventTarget & HTMLElement)>(null);
    const [ selectorVisible, setSelectorVisible ] = useState(false);

    const selectStyle = (styleId: number) =>
    {
        selectChatStyleId(styleId);
        setSelectorVisible(false); // Opcional: Se quiser que a janela continue aberta ao escolher o balão, remova esta linha.
    }

    const toggleSelector = (event: MouseEvent<HTMLElement>) =>
    {
        let visible = false;

        setSelectorVisible(prevValue =>
        {
            visible = !prevValue;
            return visible;
        });

        if(visible) setTarget((event.target as (EventTarget & HTMLElement)));
    }

    useEffect(() =>
    {
        if(selectorVisible) return;
        setTarget(null);
    }, [ selectorVisible ]);

    // Array com os tamanhos de texto disponíveis
    const textSizes = ['M', 'L', 'XL', 'XXL'];

    return (
        <>
            <Base pointer className="icon chatstyles-icon" onClick={ toggleSelector } />
            <Overlay show={ selectorVisible } target={ target } placement="top">
                <Popover className="nitro-chat-style-selector-container image-rendering-pixelated">
                    {/* Adicionado gap={2} para separar o cabeçalho dos balões */}
                    <NitroCardContentView overflow="hidden" className="bg-transparent" gap={2}>
                        
                        {/* --- NOVO: SELETOR DE TAMANHO DE TEXTO --- */}
                        <Flex alignItems="center" justifyContent="between" className="px-2 py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <Text bold style={{ color: '#e0e0e0', fontSize: '12px' }}>Tamanho do texto</Text>
                            <Flex gap={2}>
                                { textSizes.map(size => (
                                    <div
                                        key={size}
                                        onClick={() => setChatTextSize && setChatTextSize(size)}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '2px 6px',
                                            borderRadius: '10px',
                                            fontWeight: 'bold',
                                            fontSize: '11px',
                                            // Lógica para deixar a opção selecionada com fundo branco e texto preto
                                            background: chatTextSize === size ? '#fff' : 'transparent',
                                            color: chatTextSize === size ? '#000' : '#888',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {size}
                                    </div>
                                ))}
                            </Flex>
                        </Flex>
                        {/* ------------------------------------------ */}

                        <Grid columnCount={ 3 } overflow="auto">
                            { chatStyleIds && (chatStyleIds.length > 0) && chatStyleIds.map((styleId) =>
                            {
                                return (
                                    <Flex center pointer key={ styleId } className="bubble-parent-container" onClick={ event => selectStyle(styleId) }>
                                        <Base key={ styleId } className="bubble-container">
                                            <Base className={ `chat-bubble bubble-${ styleId }` }>&nbsp;</Base>
                                        </Base>
                                    </Flex>
                                );
                            }) }
                        </Grid>
                    </NitroCardContentView>
                </Popover>
            </Overlay>
        </>
    );
}
