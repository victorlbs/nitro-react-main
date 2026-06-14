import { RateFlatMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useState } from 'react';
import { CreateLinkEvent, GetRoomEngine, SendMessageComposer } from '../../../../api';
import { useNavigator, useRoom } from '../../../../hooks';

export const RoomToolsWidgetView: FC<{}> = props =>
{
    const [ zoomLevel, setZoomLevel ] = useState<number>(1);
    const [ isExpanded, setIsExpanded ] = useState<boolean>(true); // Controle de abrir/fechar o menu
    const [ isChatHidden, setIsChatHidden ] = useState<boolean>(false); // Controle do texto dos balões
    
    const { navigatorData = null } = useNavigator();
    const { roomSession = null } = useRoom();

    const handleZoom = (action: 'in' | 'out') =>
    {
        if(!roomSession) return;

        setZoomLevel(prevZoom => {
            let newZoom = action === 'in' ? prevZoom + 1 : prevZoom - 1;

            if (newZoom < 1) newZoom = 1;
            if (newZoom > 3) newZoom = 3;

            if (newZoom !== prevZoom) {
                GetRoomEngine().setRoomInstanceRenderingCanvasScale(roomSession.roomId, 1, newZoom);
            }

            return newZoom;
        });
    }

  const handleToolClick = (action: string, value?: string) =>
    {
        switch(action)
        {
            case 'settings':
                CreateLinkEvent('navigator/toggle-room-info');
                return;
            case 'chat_history':
                CreateLinkEvent('chat-history/toggle');
                return;
            case 'like_room':
                SendMessageComposer(new RateFlatMessageComposer(1));
                return;
            case 'toggle_room_link':
                CreateLinkEvent('navigator/toggle-room-link');
                return;
            case 'toggle_chat_bubbles':
                setIsChatHidden(prevState => {
                    const newState = !prevState;
                    if (newState) document.body.classList.add('hide-chat-bubbles');
                    else document.body.classList.remove('hide-chat-bubbles');
                    return newState;
                });
                return;
           case 'toggle_build_panel':
                // Verifica se a função externa já carregou na página e a executa
                if (typeof (window as any).abrirModalConstrucao === 'function') {
                    (window as any).abrirModalConstrucao();
                } else {
                    console.warn("A função abrirModalConstrucao não foi encontrada no window.");
                }
                return;
                case 'toggle_room_video':
                // Verifica se a função de vídeo já carregou na página e a executa
                if (typeof (window as any).abrirCaixaEscolhaVideo === 'function') {
                    (window as any).abrirCaixaEscolhaVideo();
                } else {
                    console.warn("A função abrirCaixaEscolhaVideo não foi encontrada no window.");
                }
                return;
        }
    }

    const rotateCamera = (direction: 'left' | 'right') => {
        // Função de girar a câmera aqui
    }

    return (
        <div className="custom-room-tools-menu">

            
            
            {/* Aba lateral que serve como botão para esconder/mostrar */}
            <div className="menu-edge-tab" onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Esconder" : "Mostrar"}>
                <i className={isExpanded ? "icon-caret-left" : "icon-caret-right"} />
            </div>

            {/* O conteúdo só renderiza se isExpanded for true */}
            { isExpanded && (
                <div className="menu-content">
                    {/* 1. Nível de Zoom */}
                    <div className="zoom-section">
                        <span className="zoom-label">Nível de Zoom: {zoomLevel}</span>
                        <div className="zoom-controls">
                            <button className="zoom-btn" onClick={() => handleZoom('in')}><i className="icon-plus-small" /></button>
                            <button className="zoom-btn" onClick={() => handleZoom('out')}><i className="icon-minus-small" /></button>
                        </div>
                    </div>

                    <hr className="menu-divider" />

                    {/* 2. Lista de Ferramentas */}
                    <div className="tools-list">
                        <div className="tool-item" onClick={ () => handleToolClick('settings') }>
                            <i className="icon icon-cog" />
                            <span className="tool-text">Preferências</span>
                        </div>
                        
                        <div className="tool-item" onClick={ () => handleToolClick('chat_history') }>
                            <i className="icon icon-chat-history" />
                            <span className="tool-text">Histórico</span>
                        </div>

                        <div className="tool-item" onClick={ () => handleToolClick('toggle_room_link') }>
                            <i className="icon icon-room-link" style={{ width: '18px', height: '18px' }} />
                            <span className="tool-text">Link para este Quarto</span>
                        </div>

                        {/* NOVO: Botão de Ocultar/Mostrar Balões */}
                        <div className="tool-item" onClick={ () => handleToolClick('toggle_chat_bubbles') }>
                            {/* Você pode trocar a classe do ícone para algum de fala bloqueada se tiver no seu CSS */}
                            <i className="icon icon-chat-history" style={{ filter: isChatHidden ? 'grayscale(100%) opacity(0.5)' : 'none' }} />
                            <span className="tool-text">{ isChatHidden ? 'Mostrar balões de fala' : 'Ocultar balões de fala' }</span>
                        </div>

                        <div className="tool-item" onClick={ () => handleToolClick('toggle_build_panel') } title="Abrir Painel de Ferramentas">
                            {/* Criamos um container do mesmo tamanho dos ícones para a sua imagem */}
                            <div style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src="https://i.imgur.com/OKiAOOc.png" style={{ maxWidth: '100%', maxHeight: '100%' }} alt="Construção" />
                            </div>
                            <span className="tool-text">Painel de Ferramentas</span>
                        </div>

                        <div className="tool-item" onClick={ () => handleToolClick('toggle_room_video') } title="Transmitir Vídeo no Quarto">
                     
                            <i 
                                className="icon icon-room-video" 
                                style={{ 
                                    width: '18px', 
                                    height: '18px', 
                            
                                    backgroundPosition: 'center', 
                                    backgroundRepeat: 'no-repeat',
                                    backgroundSize: 'contain' /* Garante que o ícone caiba no espaço pequeno */
                                }} 
                            />
                            <span className="tool-text">Transmitir Vídeo</span>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}
