import { HabboClubLevelEnum, RoomControllerLevel } from '@nitrots/nitro-renderer';
import { FC, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap'; // Importações adicionadas para o menu de emojis
import { createPortal } from 'react-dom';
import { ChatMessageTypeEnum, GetClubMemberLevel, GetConfiguration, GetSessionDataManager, LocalizeText, RoomWidgetUpdateChatInputContentEvent } from '../../../../api';
import { Base, Flex, Grid, NitroCardContentView, Text } from '../../../../common'; // Importações ajustadas
import { useChatInputWidget, useRoom, useSessionInfo, useUiEvent } from '../../../../hooks';
import { ChatInputStyleSelectorView } from './ChatInputStyleSelectorView';
import { HabbiconsView } from './HabbiconsView';

// NOVO: Lista simples de Emojis. Você pode adicionar quantos quiser aqui.
const EMOJI_LIST = [
    // --- Carinhas e Emoções ---
    '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
    
    // --- Mãos e Gestos ---
    '👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄','💋','🩸',
    
    // --- Corações e Símbolos ---
    '💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💯','💢','💬','👁️‍🗨️','🗨️','🗯️','💭','💤','💮','♨️','💈','🛑','🔞','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🈳','🈂️','🛂','🛃','🛄','🛅',
    
    // --- Animais e Natureza ---
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷','🕸','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🪵','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🍄','🐚','🪨','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐️','🌟','✨','⚡️','☄️','💥','🔥','🌪','🌈','☀️','🌤','⛅️','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄️','🌬','💨','💧','💦','☔️','☂️','🌊','🌫',
    
    // --- Comidas e Bebidas ---
    '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕️','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽','🥣','🥡','🥢','🧂'
];
export const ChatInputView: FC<{}> = props =>
{
    const [ chatValue, setChatValue ] = useState<string>('');
    const { chatStyleId = 0, updateChatStyleId = null } = useSessionInfo();
    const { selectedUsername = '', floodBlocked = false, floodBlockedSeconds = 0, setIsTyping = null, setIsIdle = null, sendChat = null } = useChatInputWidget();
    const { roomSession = null } = useRoom();
    const inputRef = useRef<HTMLInputElement>();

    const chatModeIdWhisper = useMemo(() => LocalizeText('widgets.chatinput.mode.whisper'), []);
    const chatModeIdShout = useMemo(() => LocalizeText('widgets.chatinput.mode.shout'), []);
    const chatModeIdSpeak = useMemo(() => LocalizeText('widgets.chatinput.mode.speak'), []);
    const maxChatLength = useMemo(() => GetConfiguration<number>('chat.input.maxlength', 100), []);
    const [ selectedTextSize, setSelectedTextSize ] = useState<string>('M');
    const [ habbiconsVisible, setHabbiconsVisible ] = useState(false);

    // NOVO: Estados para controlar a aba de Emojis
    const [ emojiSelectorVisible, setEmojiSelectorVisible ] = useState(false);
    const [ emojiTarget, setEmojiTarget ] = useState<(EventTarget & HTMLElement)>(null);

    useEffect(() => {
        document.body.classList.remove('chat-size-M', 'chat-size-L', 'chat-size-XL', 'chat-size-XXL');
        document.body.classList.add(`chat-size-${selectedTextSize}`);
    }, [selectedTextSize]);

    const anotherInputHasFocus = useCallback(() =>
    {
        const activeElement = document.activeElement;
        if(!activeElement) return false;
        if(inputRef && (inputRef.current === activeElement)) return false;
        if(!(activeElement instanceof HTMLInputElement) && !(activeElement instanceof HTMLTextAreaElement)) return false;
        return true;
    }, [ inputRef ]);

    const setInputFocus = useCallback(() =>
    {
        inputRef.current.focus();
        inputRef.current.setSelectionRange((inputRef.current.value.length * 2), (inputRef.current.value.length * 2));
    }, [ inputRef ]);

    const checkSpecialKeywordForInput = useCallback(() =>
    {
        setChatValue(prevValue =>
        {
            if((prevValue !== chatModeIdWhisper) || !selectedUsername.length) return prevValue;
            return (`${ prevValue } ${ selectedUsername }`);
        });
    }, [ selectedUsername, chatModeIdWhisper ]);

    const sendChatValue = useCallback((value: string, shiftKey: boolean = false) =>
    {
        if(!value || (value === '')) return;

        let chatType = (shiftKey ? ChatMessageTypeEnum.CHAT_SHOUT : ChatMessageTypeEnum.CHAT_DEFAULT);
        let text = value;

        const parts = text.split(' ');

        let recipientName = '';
        let append = '';

        switch(parts[0])
        {
            case chatModeIdWhisper:
                chatType = ChatMessageTypeEnum.CHAT_WHISPER;
                recipientName = parts[1];
                append = (chatModeIdWhisper + ' ' + recipientName + ' ');
                parts.shift();
                parts.shift();
                break;
            case chatModeIdShout:
                chatType = ChatMessageTypeEnum.CHAT_SHOUT;
                parts.shift();
                break;
            case chatModeIdSpeak:
                chatType = ChatMessageTypeEnum.CHAT_DEFAULT;
                parts.shift();
                break;
        }

        text = parts.join(' ');

        setIsTyping(false);
        setIsIdle(false);

        if(text.length <= maxChatLength)
        {
            if(/%CC%/g.test(encodeURIComponent(text)))
            {
                setChatValue('');
            }
            else
            {
                setChatValue('');
                sendChat(text, chatType, recipientName, chatStyleId);
            }
        }

        setChatValue(append);
    }, [ chatModeIdWhisper, chatModeIdShout, chatModeIdSpeak, maxChatLength, chatStyleId, setIsTyping, setIsIdle, sendChat ]);

    const updateChatInput = useCallback((value: string) =>
    {
        if(!value || !value.length)
        {
            setIsTyping(false);
        }
        else
        {
            setIsTyping(true);
            setIsIdle(true);
        }

        setChatValue(value);
    }, [ setIsTyping, setIsIdle ]);

    const onKeyDownEvent = useCallback((event: KeyboardEvent) =>
    {
        if(floodBlocked || !inputRef.current || anotherInputHasFocus()) return;

        if(document.activeElement !== inputRef.current) setInputFocus();

        const value = (event.target as HTMLInputElement).value;

        switch(event.key)
        {
            case ' ':
            case 'Space':
                checkSpecialKeywordForInput();
                return;
            case 'NumpadEnter':
            case 'Enter':
                sendChatValue(value, event.shiftKey);
                return;
            case 'Backspace':
                if(value)
                {
                    const parts = value.split(' ');
                    if((parts[0] === chatModeIdWhisper) && (parts.length === 3) && (parts[2] === ''))
                    {
                        setChatValue('');
                    }
                }
                return;
        }

    }, [ floodBlocked, inputRef, chatModeIdWhisper, anotherInputHasFocus, setInputFocus, checkSpecialKeywordForInput, sendChatValue ]);

    useUiEvent<RoomWidgetUpdateChatInputContentEvent>(RoomWidgetUpdateChatInputContentEvent.CHAT_INPUT_CONTENT, event =>
    {
        switch(event.chatMode)
        {
            case RoomWidgetUpdateChatInputContentEvent.WHISPER: {
                setChatValue(`${ chatModeIdWhisper } ${ event.userName } `);
                return;
            }
            case RoomWidgetUpdateChatInputContentEvent.SHOUT:
                return;
        }
    });

    const chatStyleIds = useMemo(() =>
    {
        let styleIds: number[] = [];
        const styles = GetConfiguration<{ styleId: number, minRank: number, isSystemStyle: boolean, isHcOnly: boolean, isAmbassadorOnly: boolean }[]>('chat.styles');

        for(const style of styles)
        {
            if(!style) continue;
            if(style.minRank > 0)
            {
                if(GetSessionDataManager().hasSecurity(style.minRank)) styleIds.push(style.styleId);
                continue;
            }
            if(style.isSystemStyle)
            {
                if(GetSessionDataManager().hasSecurity(RoomControllerLevel.MODERATOR))
                {
                    styleIds.push(style.styleId);
                    continue;
                }
            }
            if(GetConfiguration<number[]>('chat.styles.disabled').indexOf(style.styleId) >= 0) continue;
            if(style.isHcOnly && (GetClubMemberLevel() >= HabboClubLevelEnum.CLUB))
            {
                styleIds.push(style.styleId);
                continue;
            }
            if(style.isAmbassadorOnly && GetSessionDataManager().isAmbassador)
            {
                styleIds.push(style.styleId);
                continue;
            }
            if(!style.isHcOnly && !style.isAmbassadorOnly) styleIds.push(style.styleId);
        }

        return styleIds;
    }, []);

    useEffect(() =>
    {
        document.body.addEventListener('keydown', onKeyDownEvent);
        return () =>
        {
            document.body.removeEventListener('keydown', onKeyDownEvent);
        }
    }, [ onKeyDownEvent ]);

    useEffect(() =>
    {
        if(!inputRef.current) return;
        inputRef.current.parentElement.dataset.value = chatValue;
    }, [ chatValue ]);

    // NOVO: Função para abrir/fechar o menu de emojis
    const toggleEmojiSelector = (event: MouseEvent<HTMLElement>) => {
        setEmojiSelectorVisible(!emojiSelectorVisible);
        if(!emojiSelectorVisible) setEmojiTarget((event.target as (EventTarget & HTMLElement)));
    }

    // NOVO: Função para injetar o emoji selecionado no input
    const selectEmoji = (emoji: string) => {
        // Pega o valor atual e concatena o emoji
        const newValue = chatValue + emoji;
        
        // Só atualiza se não passar do limite
        if (newValue.length <= maxChatLength) {
            updateChatInput(newValue);
        }
        
        // Traz o foco de volta pro input depois de clicar
        setInputFocus();
        
        // Opcional: Fecha a janela após escolher o emoji. (Comentei a linha para manter aberta)
        // setEmojiSelectorVisible(false);
    }

    if(!roomSession || roomSession.isSpectator) return null;

    return (
        createPortal(
            <div className="nitro-chat-input-container">
                <div className="input-sizer align-items-center">
                    { !floodBlocked &&
                    <input ref={ inputRef } type="text" className="chat-input" placeholder={ LocalizeText('widgets.chatinput.default') } value={ chatValue } maxLength={ maxChatLength } onChange={ event => updateChatInput(event.target.value) } onMouseDown={ event => setInputFocus() } /> }
                    { floodBlocked &&
                    <Text variant="danger">{ LocalizeText('chat.input.alert.flood', [ 'time' ], [ floodBlockedSeconds.toString() ]) } </Text> }
                </div>

                {/* NOVO: Botão e Janela de Emojis */}
                <div style={{ marginLeft: '5px', display: 'flex', alignItems: 'center' }}>
                    <Base pointer onClick={toggleEmojiSelector} style={{ fontSize: '18px', color: '#000', padding: '0 5px' }}>
                        😎
                    </Base>
                     <Base pointer     onClick={ () => setHabbiconsVisible(true) } style={{ fontSize: '18px', color: '#000', padding: '0 5px' }}>
                        🐤
                    </Base>
                    
                    <Overlay show={emojiSelectorVisible} target={emojiTarget} placement="top">
                        <Popover className="nitro-chat-style-selector-container image-rendering-pixelated">
                            <NitroCardContentView overflow="hidden" className="bg-transparent" style={{ width: '180px', padding: '10px' }}>
                                <Text bold style={{ color: '#000', fontSize: '12px', marginBottom: '8px' }}>Emojis</Text>
                                <Grid columnCount={5} gap={1} overflow="auto" style={{ maxHeight: '150px' }}>
                                    {EMOJI_LIST.map((emoji, index) => (
                                        <Flex 
                                            center 
                                            pointer 
                                            key={index} 
                                            onClick={() => selectEmoji(emoji)}
                                            style={{ fontSize: '16px', padding: '2px', transition: 'transform 0.1s' }}
                                            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                                            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                        >
                                            {emoji}
                                        </Flex>
                                    ))}
                                </Grid>
                            </NitroCardContentView>
                        </Popover>
                    </Overlay>
                </div>
                {/* ----------------------------- */}

                {/* BOTÃO HABBICONS - POSICIONADO FORA DA BARRA DO CHAT */}
           

                <ChatInputStyleSelectorView 
                    chatStyleId={ chatStyleId } 
                    chatStyleIds={ chatStyleIds } 
                    selectChatStyleId={ updateChatStyleId } 
                    chatTextSize={ selectedTextSize }
                    setChatTextSize={ setSelectedTextSize } 
                />

                { habbiconsVisible &&
                    <HabbiconsView onClose={ () => setHabbiconsVisible(false) } /> }
            </div>, document.getElementById('toolbar-chat-input-container'))
    );
}
