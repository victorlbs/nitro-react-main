import { ILinkEventTracker, RoomEngineEvent, RoomId, RoomObjectCategory, RoomObjectType } from '@nitrots/nitro-renderer';
import { ChangeEvent, FC, useEffect, useMemo, useRef, useState } from 'react';
import { AddEventLinkTracker, CreateLinkEvent, GetRoomSession, ISelectedUser, RemoveLinkEventTracker } from '../../api';
import { Base, Button, DraggableWindowPosition, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useModTools, useObjectSelectedEvent, useRoomEngineEvent } from '../../hooks';
import { ModToolsChatlogView } from './views/room/ModToolsChatlogView';
import { ModToolsRoomView } from './views/room/ModToolsRoomView';
import { ModToolsTicketsView } from './views/tickets/ModToolsTicketsView';
import { ModToolsUserChatlogView } from './views/user/ModToolsUserChatlogView';
import { ModToolsUserView } from './views/user/ModToolsUserView';

type CompactTab = 'inicio' | 'usuario' | 'sala' | 'tickets' | 'mais';
type ThemeName = 'claro' | 'escuro';
type RecentAction = { id: string; label: string; detail: string; createdAt: number; action?: 'room' | 'user' | 'tickets' | 'chatlog' };
type StaffNote = { id: string; target: string; text: string; createdAt: number };
type FavoriteItem = { id: string; type: 'user' | 'room' | 'template'; label: string; value: string };
type MonitoredItem = { userId: number; username: string; reason: string; createdAt: number };
type StaffTemplate = { id: string; title: string; text: string };

const STORAGE = 'nitro.modtools.compact.';

const readStorage = <T,>(key: string, fallback: T): T =>
{
    try
    {
        const value = localStorage.getItem(STORAGE + key);
        return value ? JSON.parse(value) as T : fallback;
    }
    catch
    {
        return fallback;
    }
};

const writeStorage = (key: string, value: unknown) =>
{
    try { localStorage.setItem(STORAGE + key, JSON.stringify(value)); }
    catch { /* navegador sem armazenamento */ }
};

const defaultTemplates: StaffTemplate[] = [
    { id: 'flood', title: 'Aviso de flood', text: 'Evite enviar mensagens repetidas. Caso continue, medidas de moderação poderão ser aplicadas.' },
    { id: 'linguagem', title: 'Linguagem inadequada', text: 'Mantenha o respeito no hotel. Linguagem ofensiva não é permitida.' },
    { id: 'golpe', title: 'Possível golpe', text: 'Não compartilhe senha, e-mail ou códigos. A equipe nunca solicitará esses dados.' },
    { id: 'links', title: 'Links externos', text: 'Não divulgue links externos ou conteúdos não autorizados no hotel.' },
    { id: 'encerrar', title: 'Encerramento de ticket', text: 'Seu atendimento foi concluído. Caso precise de mais ajuda, abra um novo ticket.' }
];

export const ModToolsView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ minimized, setMinimized ] = useState(false);
    const [ activeTab, setActiveTab ] = useState<CompactTab>('inicio');
    const [ currentRoomId, setCurrentRoomId ] = useState(-1);
    const [ selectedUser, setSelectedUser ] = useState<ISelectedUser>(null);
    const [ isTicketsVisible, setIsTicketsVisible ] = useState(false);
    const [ search, setSearch ] = useState('');
    const [ toast, setToast ] = useState('');
    const [ theme, setTheme ] = useState<ThemeName>(() => readStorage('theme', 'claro'));
    const [ discreet, setDiscreet ] = useState(() => readStorage('discreet', false));
    const [ alwaysOnTop, setAlwaysOnTop ] = useState(() => readStorage('alwaysOnTop', true));
    const [ recent, setRecent ] = useState<RecentAction[]>(() => readStorage('recent', []));
    const [ favorites, setFavorites ] = useState<FavoriteItem[]>(() => readStorage('favorites', []));
    const [ notes, setNotes ] = useState<StaffNote[]>(() => readStorage('notes', []));
    const [ templates, setTemplates ] = useState<StaffTemplate[]>(() => readStorage('templates', defaultTemplates));
    const [ monitored, setMonitored ] = useState<MonitoredItem[]>(() => readStorage('monitored', []));
    const [ noteText, setNoteText ] = useState('');
    const [ monitorReason, setMonitorReason ] = useState('');
    const [ selectedTemplateId, setSelectedTemplateId ] = useState(defaultTemplates[0].id);
    const [ reasonCategory, setReasonCategory ] = useState('Flood');
    const [ reasonDuration, setReasonDuration ] = useState('10 minutos');
    const [ reasonObservation, setReasonObservation ] = useState('');
    const [ punishmentValue, setPunishmentValue ] = useState('10');
    const [ punishmentUnit, setPunishmentUnit ] = useState<'minutos' | 'horas' | 'dias'>('minutos');
    const [ confirmText, setConfirmText ] = useState('');
    const importRef = useRef<HTMLInputElement>(null);

    const {
        tickets = [], openRooms = [], openRoomChatlogs = [], openUserChatlogs = [], openUserInfos = [],
        openRoomInfo = null, closeRoomInfo = null, toggleRoomInfo = null,
        openRoomChatlog = null, closeRoomChatlog = null, toggleRoomChatlog = null,
        openUserInfo = null, closeUserInfo = null, toggleUserInfo = null,
        openUserChatlog = null, closeUserChatlog = null, toggleUserChatlog = null
    } = useModTools();

    const openTickets = useMemo(() => tickets.filter(ticket => !ticket.pickerUserId), [ tickets ]);
    const oldestTicket = useMemo(() => [ ...openTickets ].sort((a, b) => b.issueAgeInMilliseconds - a.issueAgeInMilliseconds)[0], [ openTickets ]);
    const selectedTemplate = useMemo(() => templates.find(item => item.id === selectedTemplateId) || templates[0], [ templates, selectedTemplateId ]);
    const currentUserNotes = useMemo(() => selectedUser ? notes.filter(note => note.target === `user:${ selectedUser.userId }`) : [], [ notes, selectedUser ]);
    const currentRoomNotes = useMemo(() => currentRoomId > 0 ? notes.filter(note => note.target === `room:${ currentRoomId }`) : [], [ notes, currentRoomId ]);
    const selectedUserRecurrences = useMemo(() => selectedUser ? recent.filter(item => item.detail.includes(`#${ selectedUser.userId }`) || item.detail.includes(selectedUser.username)).length : 0, [ recent, selectedUser ]);

    const pushToast = (message: string) =>
    {
        setToast(message);
        window.setTimeout(() => setToast(''), 2300);
    };

    const addRecent = (label: string, detail = '', action?: RecentAction['action']) =>
    {
        const item: RecentAction = { id: `${ Date.now() }-${ Math.random() }`, label, detail, createdAt: Date.now(), action };
        setRecent(previous =>
        {
            const next = [ item, ...previous ].slice(0, 60);
            writeStorage('recent', next);
            return next;
        });
        pushToast(label);
    };

    useEffect(() => { writeStorage('theme', theme); }, [ theme ]);
    useEffect(() => { writeStorage('discreet', discreet); }, [ discreet ]);
    useEffect(() => { writeStorage('alwaysOnTop', alwaysOnTop); }, [ alwaysOnTop ]);
    useEffect(() => { writeStorage('favorites', favorites); }, [ favorites ]);
    useEffect(() => { writeStorage('notes', notes); }, [ notes ]);
    useEffect(() => { writeStorage('templates', templates); }, [ templates ]);
    useEffect(() => { writeStorage('monitored', monitored); }, [ monitored ]);

    useRoomEngineEvent<RoomEngineEvent>([ RoomEngineEvent.INITIALIZED, RoomEngineEvent.DISPOSED ], event =>
    {
        if(RoomId.isRoomPreviewerId(event.roomId)) return;
        if(event.type === RoomEngineEvent.INITIALIZED) setCurrentRoomId(event.roomId);
        if(event.type === RoomEngineEvent.DISPOSED) setCurrentRoomId(-1);
    });

    useObjectSelectedEvent(event =>
    {
        if(event.category !== RoomObjectCategory.UNIT) return;
        const roomSession = GetRoomSession();
        if(!roomSession) return;
        const userData = roomSession.userDataManager.getUserDataByIndex(event.id);
        if(!userData || userData.type !== RoomObjectType.USER) return;
        setSelectedUser({ userId: userData.webID, username: userData.name });
    });

    useEffect(() =>
    {
        const onKeyDown = (event: KeyboardEvent) =>
        {
            if(event.altKey && event.key.toLowerCase() === 'm')
            {
                event.preventDefault();
                setIsVisible(value => !value);
            }
            if(event.altKey && event.key.toLowerCase() === 't')
            {
                event.preventDefault();
                setIsVisible(true); setMinimized(false); setActiveTab('tickets');
            }
            if(event.altKey && event.key.toLowerCase() === 'u')
            {
                event.preventDefault();
                setIsVisible(true); setMinimized(false); setActiveTab('usuario');
            }
            if(event.altKey && event.key.toLowerCase() === 'r')
            {
                event.preventDefault();
                setIsVisible(true); setMinimized(false); setActiveTab('sala');
            }
            if(event.key === 'Escape' && isVisible) setMinimized(true);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [ isVisible ]);

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');
                if(parts.length < 2) return;
                switch(parts[1])
                {
                    case 'show': setIsVisible(true); setMinimized(false); return;
                    case 'hide': setIsVisible(false); return;
                    case 'toggle': setIsVisible(value => !value); return;
                    case 'open-room-info': openRoomInfo(Number(parts[2])); return;
                    case 'close-room-info': closeRoomInfo(Number(parts[2])); return;
                    case 'toggle-room-info': toggleRoomInfo(Number(parts[2])); return;
                    case 'open-room-chatlog': openRoomChatlog(Number(parts[2])); return;
                    case 'close-room-chatlog': closeRoomChatlog(Number(parts[2])); return;
                    case 'toggle-room-chatlog': toggleRoomChatlog(Number(parts[2])); return;
                    case 'open-user-info': openUserInfo(Number(parts[2])); return;
                    case 'close-user-info': closeUserInfo(Number(parts[2])); return;
                    case 'toggle-user-info': toggleUserInfo(Number(parts[2])); return;
                    case 'open-user-chatlog': openUserChatlog(Number(parts[2])); return;
                    case 'close-user-chatlog': closeUserChatlog(Number(parts[2])); return;
                    case 'toggle-user-chatlog': toggleUserChatlog(Number(parts[2])); return;
                }
            },
            eventUrlPrefix: 'mod-tools/'
        };
        AddEventLinkTracker(linkTracker);
        return () => RemoveLinkEventTracker(linkTracker);
    }, [ openRoomInfo, closeRoomInfo, toggleRoomInfo, openRoomChatlog, closeRoomChatlog, toggleRoomChatlog, openUserInfo, closeUserInfo, toggleUserInfo, openUserChatlog, closeUserChatlog, toggleUserChatlog ]);

    const copyText = async (value: string, success = 'Copiado') =>
    {
        try
        {
            if(navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
            else
            {
                const textarea = document.createElement('textarea');
                textarea.value = value;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
            }
            pushToast(success);
        }
        catch { pushToast('Não foi possível copiar'); }
    };

    const executeSearch = () =>
    {
        const query = search.trim();
        if(!query) return;
        const id = parseInt(query.replace(/\D/g, ''));
        if(Number.isNaN(id) || id <= 0) return pushToast('Informe um ID válido');
        if(query.toLowerCase().includes('sala') || query.toLowerCase().includes('room'))
        {
            openRoomInfo(id); addRecent('Sala pesquisada', `Sala #${ id }`, 'room');
        }
        else if(query.toLowerCase().includes('ticket'))
        {
            setIsTicketsVisible(true); setActiveTab('tickets'); addRecent('Ticket pesquisado', `Ticket #${ id }`, 'tickets');
        }
        else
        {
            openUserInfo(id); addRecent('Usuário pesquisado', `Usuário #${ id }`, 'user');
        }
    };

    const addFavorite = (type: FavoriteItem['type'], label: string, value: string) =>
    {
        const id = `${ type }:${ value }`;
        setFavorites(previous => previous.some(item => item.id === id) ? previous.filter(item => item.id !== id) : [ { id, type, label, value }, ...previous ]);
        pushToast('Favoritos atualizados');
    };

    const openFavorite = (item: FavoriteItem) =>
    {
        if(item.type === 'user') openUserInfo(Number(item.value));
        if(item.type === 'room') openRoomInfo(Number(item.value));
        if(item.type === 'template')
        {
            setSelectedTemplateId(item.value);
            setActiveTab('mais');
        }
        addRecent('Favorito aberto', item.label, item.type === 'room' ? 'room' : item.type === 'user' ? 'user' : undefined);
    };

    const saveNote = (target: string) =>
    {
        const text = noteText.trim();
        if(!text) return;
        setNotes(previous => [ { id: `${ Date.now() }`, target, text, createdAt: Date.now() }, ...previous ].slice(0, 150));
        setNoteText('');
        pushToast('Nota privada salva');
    };

    const toggleMonitor = () =>
    {
        if(!selectedUser) return;
        const exists = monitored.some(item => item.userId === selectedUser.userId);
        setMonitored(previous => exists ? previous.filter(item => item.userId !== selectedUser.userId) : [ { userId: selectedUser.userId, username: selectedUser.username, reason: monitorReason.trim() || 'Sem motivo informado', createdAt: Date.now() }, ...previous ]);
        setMonitorReason('');
        pushToast(exists ? 'Usuário removido da monitoração' : 'Usuário adicionado à monitoração');
    };

    const generatedReason = `${ reasonCategory } — ${ reasonDuration }${ reasonObservation.trim() ? ` — ${ reasonObservation.trim() }` : '' }`;
    const punishmentMinutes = Math.max(0, Number(punishmentValue) || 0) * (punishmentUnit === 'dias' ? 1440 : punishmentUnit === 'horas' ? 60 : 1);
    const punishmentLabel = punishmentMinutes >= 1440 ? `${ (punishmentMinutes / 1440).toFixed(punishmentMinutes % 1440 === 0 ? 0 : 1) } dia(s)` : punishmentMinutes >= 60 ? `${ (punishmentMinutes / 60).toFixed(punishmentMinutes % 60 === 0 ? 0 : 1) } hora(s)` : `${ punishmentMinutes } minuto(s)`;

    const requestDangerousAction = (message: string, callback: () => void) =>
    {
        setConfirmText(message);
        if(window.confirm(message)) callback();
        setConfirmText('');
    };

    const exportSettings = () =>
    {
        const payload = { version: 1, exportedAt: new Date().toISOString(), theme, discreet, alwaysOnTop, recent, favorites, notes, templates, monitored };
        const blob = new Blob([ JSON.stringify(payload, null, 2) ], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `mod-tools-backup-${ new Date().toISOString().slice(0, 10) }.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        pushToast('Backup exportado');
    };

    const importSettings = (event: ChangeEvent<HTMLInputElement>) =>
    {
        const file = event.target.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = () =>
        {
            try
            {
                const data = JSON.parse(String(reader.result));
                if(Array.isArray(data.recent)) setRecent(data.recent);
                if(Array.isArray(data.favorites)) setFavorites(data.favorites);
                if(Array.isArray(data.notes)) setNotes(data.notes);
                if(Array.isArray(data.templates)) setTemplates(data.templates);
                if(Array.isArray(data.monitored)) setMonitored(data.monitored);
                if(data.theme === 'claro' || data.theme === 'escuro') setTheme(data.theme);
                setDiscreet(Boolean(data.discreet));
                setAlwaysOnTop(data.alwaysOnTop !== false);
                pushToast('Backup importado');
            }
            catch { pushToast('Arquivo de backup inválido'); }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const repeatRecent = (item: RecentAction) =>
    {
        const id = parseInt(item.detail.replace(/\D/g, ''));
        if(item.action === 'room' && id > 0) openRoomInfo(id);
        if(item.action === 'user' && id > 0) openUserInfo(id);
        if(item.action === 'chatlog' && id > 0) openRoomChatlog(id);
        if(item.action === 'tickets') setIsTicketsVisible(true);
        pushToast('Ação repetida');
    };

    const tabs: { id: CompactTab; label: string; icon: string }[] = [
        { id: 'inicio', label: 'Início', icon: '⌂' },
        { id: 'usuario', label: 'Usuário', icon: '👤' },
        { id: 'sala', label: 'Sala', icon: '🚪' },
        { id: 'tickets', label: 'Tickets', icon: '🎫' },
        { id: 'mais', label: 'Mais', icon: '•••' }
    ];

    return (
        <>
            { isVisible && minimized &&
                <button className={ `modtools-mini-bar theme-${ theme } ${ discreet ? 'is-discreet' : '' } ${ alwaysOnTop ? 'is-top' : '' }` } onClick={ () => setMinimized(false) }>
                    <span>🛡 Mod Tools</span><b>{ openTickets.length }</b><small>{ selectedUser?.username || (currentRoomId > 0 ? `Sala #${ currentRoomId }` : 'Abrir') }</small>
                </button> }

            { isVisible && !minimized &&
                <NitroCardView uniqueKey="mod-tools" className={ `nitro-mod-tools nitro-mod-tools-compact theme-${ theme } ${ discreet ? 'is-discreet' : '' } ${ alwaysOnTop ? 'is-top' : '' }` } windowPosition={ DraggableWindowPosition.TOP_LEFT } theme="primary-slim">
                    <NitroCardHeaderView headerText="Mod Tools" onCloseClick={ () => setIsVisible(false) } />
                    <NitroCardContentView className="text-black compact-modtools-content" gap={ 0 }>
                        <div className="modtools-compact-head">
                            <div className="modtools-status-strip">
                                <span>🎫 { openTickets.length }</span><span>🚪 { currentRoomId > 0 ? currentRoomId : '—' }</span><span>👤 { selectedUser?.username || '—' }</span>
                                <button title="Recolher" onClick={ () => setMinimized(true) }>—</button>
                            </div>
                            <div className="modtools-search-row">
                                <input value={ search } onChange={ event => setSearch(event.target.value) } onKeyDown={ event => event.key === 'Enter' && executeSearch() } placeholder="ID, sala 123 ou ticket 45" />
                                <button onClick={ executeSearch }>⌕</button>
                            </div>
                        </div>

                        <div className="modtools-tabbar">
                            { tabs.map(tab => <button key={ tab.id } className={ activeTab === tab.id ? 'active' : '' } onClick={ () => setActiveTab(tab.id) }><span>{ tab.icon }</span><small>{ tab.label }</small>{ tab.id === 'tickets' && openTickets.length > 0 && <b>{ openTickets.length }</b> }</button>) }
                        </div>

                        <div className="modtools-compact-body">
                            { activeTab === 'inicio' && <>
                                <div className="modtools-quick-grid">
                                    <button disabled={ currentRoomId <= 0 } onClick={ () => { openRoomInfo(currentRoomId); addRecent('Sala aberta', `Sala #${ currentRoomId }`, 'room'); } }>🚪<span>Sala</span></button>
                                    <button disabled={ currentRoomId <= 0 } onClick={ () => { openRoomChatlog(currentRoomId); addRecent('Chatlog aberto', `Sala #${ currentRoomId }`, 'chatlog'); } }>💬<span>Chatlog</span></button>
                                    <button disabled={ !selectedUser } onClick={ () => { if(!selectedUser) return; openUserInfo(selectedUser.userId); addRecent('Perfil aberto', `${ selectedUser.username } #${ selectedUser.userId }`, 'user'); } }>👤<span>Perfil</span></button>
                                    <button onClick={ () => { setIsTicketsVisible(true); addRecent('Tickets abertos', `${ openTickets.length } pendentes`, 'tickets'); } }>🎫<span>Tickets</span></button>
                                    <button disabled={ !selectedUser } onClick={ () => selectedUser && openUserChatlog(selectedUser.userId) }>📜<span>Histórico</span></button>
                                    <button onClick={ () => CreateLinkEvent('wired-tool/toggle') }>⚡<span>Wired</span></button>
                                </div>

                                <section className="modtools-box">
                                    <header><b>Ações recentes</b><button onClick={ () => { setRecent([]); writeStorage('recent', []); } }>Limpar</button></header>
                                    <div className="modtools-list compact-list">
                                        { recent.slice(0, 5).map(item => <div key={ item.id } className="modtools-row"><span><b>{ item.label }</b><small>{ item.detail } · { new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }</small></span><button onClick={ () => repeatRecent(item) }>↻</button></div>) }
                                        { recent.length === 0 && <p className="modtools-empty">Nenhuma ação recente.</p> }
                                    </div>
                                </section>

                                <section className="modtools-box">
                                    <header><b>Favoritos</b><small>{ favorites.length }</small></header>
                                    <div className="modtools-chip-wrap">
                                        { favorites.slice(0, 8).map(item => <button key={ item.id } className="modtools-chip" onClick={ () => openFavorite(item) }>{ item.type === 'user' ? '👤' : item.type === 'room' ? '🚪' : '💬' } { item.label }</button>) }
                                        { favorites.length === 0 && <p className="modtools-empty">Adicione usuários, salas ou modelos.</p> }
                                    </div>
                                </section>
                            </> }

                            { activeTab === 'usuario' && <>
                                <section className="modtools-box">
                                    <header><b>Usuário selecionado</b>{ selectedUser && <button onClick={ () => addFavorite('user', selectedUser.username, String(selectedUser.userId)) }>☆</button> }</header>
                                    { selectedUser ? <>
                                        <div className="modtools-user-summary"><div className="modtools-avatar">{ selectedUser.username.slice(0, 1).toUpperCase() }</div><span><b>{ selectedUser.username }</b><small>ID #{ selectedUser.userId } · reincidências locais: { selectedUserRecurrences }</small></span><button onClick={ () => copyText(String(selectedUser.userId), 'ID copiado') }>⧉</button></div>
                                        <div className="modtools-action-grid">
                                            <button onClick={ () => openUserInfo(selectedUser.userId) }>Abrir perfil</button>
                                            <button onClick={ () => openUserChatlog(selectedUser.userId) }>Chatlog</button>
                                            <button onClick={ () => copyText(`${ selectedUser.username } (#${ selectedUser.userId })`) }>Copiar dados</button>
                                            <button onClick={ () => requestDangerousAction(`Abrir as ações de moderação para ${ selectedUser.username }?`, () => openUserInfo(selectedUser.userId)) }>Ações</button>
                                        </div>
                                    </> : <p className="modtools-empty">Clique em um avatar no quarto.</p> }
                                </section>

                                { selectedUser && <>
                                    <section className="modtools-box">
                                        <header><b>Notas rápidas</b><small>{ currentUserNotes.length }</small></header>
                                        <textarea value={ noteText } onChange={ event => setNoteText(event.target.value) } placeholder="Nota privada neste navegador..." />
                                        <button className="modtools-primary" onClick={ () => saveNote(`user:${ selectedUser.userId }`) }>Salvar nota</button>
                                        <div className="modtools-list notes-list">{ currentUserNotes.slice(0, 3).map(note => <div key={ note.id } className="modtools-note"><span>{ note.text }</span><button onClick={ () => setNotes(previous => previous.filter(item => item.id !== note.id)) }>×</button></div>) }</div>
                                    </section>

                                    <section className="modtools-box">
                                        <header><b>Monitoramento local</b><small>{ monitored.some(item => item.userId === selectedUser.userId) ? 'Ativo' : 'Inativo' }</small></header>
                                        <input value={ monitorReason } onChange={ event => setMonitorReason(event.target.value) } placeholder="Motivo do monitoramento" />
                                        <button className={ monitored.some(item => item.userId === selectedUser.userId) ? 'modtools-danger' : 'modtools-primary' } onClick={ toggleMonitor }>{ monitored.some(item => item.userId === selectedUser.userId) ? 'Parar de monitorar' : 'Monitorar usuário' }</button>
                                    </section>
                                </> }
                            </> }

                            { activeTab === 'sala' && <>
                                <section className="modtools-box">
                                    <header><b>Sala atual</b>{ currentRoomId > 0 && <button onClick={ () => addFavorite('room', `Sala ${ currentRoomId }`, String(currentRoomId)) }>☆</button> }</header>
                                    <div className="modtools-room-summary"><strong>{ currentRoomId > 0 ? `#${ currentRoomId }` : 'Fora de uma sala' }</strong><button disabled={ currentRoomId <= 0 } onClick={ () => copyText(String(currentRoomId), 'ID da sala copiado') }>Copiar ID</button></div>
                                    <div className="modtools-action-grid">
                                        <button disabled={ currentRoomId <= 0 } onClick={ () => openRoomInfo(currentRoomId) }>Painel</button>
                                        <button disabled={ currentRoomId <= 0 } onClick={ () => openRoomChatlog(currentRoomId) }>Chatlog</button>
                                        <button disabled={ currentRoomId <= 0 } onClick={ () => requestDangerousAction('Deseja abrir as ferramentas da sala? Revise antes de expulsar todos ou alterar a sala.', () => openRoomInfo(currentRoomId)) }>Intervir</button>
                                        <button onClick={ () => { setSearch('sala '); pushToast('Digite o ID da sala'); } }>Outra sala</button>
                                    </div>
                                </section>
                                { currentRoomId > 0 && <section className="modtools-box"><header><b>Notas da sala</b><small>{ currentRoomNotes.length }</small></header><textarea value={ noteText } onChange={ event => setNoteText(event.target.value) } placeholder="Ocorrência, evento ou observação..." /><button className="modtools-primary" onClick={ () => saveNote(`room:${ currentRoomId }`) }>Salvar nota</button><div className="modtools-list notes-list">{ currentRoomNotes.slice(0, 3).map(note => <div key={ note.id } className="modtools-note"><span>{ note.text }</span><button onClick={ () => setNotes(previous => previous.filter(item => item.id !== note.id)) }>×</button></div>) }</div></section> }
                            </> }

                            { activeTab === 'tickets' && <>
                                <section className="modtools-box">
                                    <header><b>Fila inteligente</b><button onClick={ () => setIsTicketsVisible(true) }>Abrir todos</button></header>
                                    <div className="modtools-ticket-status"><span><strong>{ openTickets.length }</strong><small>abertos</small></span><span><strong>{ oldestTicket ? Math.max(1, Math.floor(oldestTicket.issueAgeInMilliseconds / 60000)) : 0 } min</strong><small>mais antigo</small></span></div>
                                    <button className="modtools-primary" disabled={ !oldestTicket } onClick={ () => { setIsTicketsVisible(true); addRecent('Próximo ticket aberto', oldestTicket ? `Ticket #${ oldestTicket.issueId }` : '', 'tickets'); } }>Atender próximo ticket</button>
                                </section>
                                <section className="modtools-box">
                                    <header><b>Tickets aguardando</b><small>prioridade por tempo</small></header>
                                    <div className="modtools-list">
                                        { openTickets.slice(0, 6).map((ticket, index) => <div key={ ticket.issueId } className={ `modtools-ticket-row priority-${ index < 1 ? 'high' : index < 3 ? 'medium' : 'low' }` }><span><b>#{ ticket.issueId } · { ticket.reportedUserName }</b><small>{ Math.max(1, Math.floor(ticket.issueAgeInMilliseconds / 60000)) } min aguardando</small></span><button onClick={ () => setIsTicketsVisible(true) }>Abrir</button></div>) }
                                        { openTickets.length === 0 && <p className="modtools-empty">Nenhum ticket aberto.</p> }
                                    </div>
                                </section>
                            </> }

                            { activeTab === 'mais' && <>
                                <section className="modtools-box">
                                    <header><b>Modelos de mensagem</b><button onClick={ () => selectedTemplate && addFavorite('template', selectedTemplate.title, selectedTemplate.id) }>☆</button></header>
                                    <select value={ selectedTemplateId } onChange={ event => setSelectedTemplateId(event.target.value) }>{ templates.map(template => <option key={ template.id } value={ template.id }>{ template.title }</option>) }</select>
                                    <textarea value={ selectedTemplate?.text || '' } onChange={ event => setTemplates(previous => previous.map(item => item.id === selectedTemplateId ? { ...item, text: event.target.value } : item)) } />
                                    <button className="modtools-primary" onClick={ () => copyText(selectedTemplate?.text || '', 'Modelo copiado') }>Copiar mensagem</button>
                                </section>

                                <section className="modtools-box">
                                    <header><b>Gerador de motivo</b><small>evita erros</small></header>
                                    <div className="modtools-two-cols"><select value={ reasonCategory } onChange={ event => setReasonCategory(event.target.value) }><option>Flood</option><option>Linguagem inadequada</option><option>Golpe</option><option>Links externos</option><option>Assédio</option><option>Outro</option></select><select value={ reasonDuration } onChange={ event => setReasonDuration(event.target.value) }><option>Alerta</option><option>10 minutos</option><option>1 hora</option><option>24 horas</option><option>7 dias</option><option>Permanente</option></select></div>
                                    <input value={ reasonObservation } onChange={ event => setReasonObservation(event.target.value) } placeholder="Observação opcional" />
                                    <div className="modtools-generated"><span>{ generatedReason }</span><button onClick={ () => copyText(generatedReason, 'Motivo copiado') }>⧉</button></div>
                                </section>

                                <section className="modtools-box">
                                    <header><b>Calculadora de punição</b><small>conversão segura</small></header>
                                    <div className="modtools-two-cols"><input type="number" min="0" value={ punishmentValue } onChange={ event => setPunishmentValue(event.target.value) } /><select value={ punishmentUnit } onChange={ event => setPunishmentUnit(event.target.value as 'minutos' | 'horas' | 'dias') }><option value="minutos">Minutos</option><option value="horas">Horas</option><option value="dias">Dias</option></select></div>
                                    <div className="modtools-calculation"><b>{ punishmentLabel }</b><small>{ punishmentMinutes * 60 } segundos para o backend</small></div>
                                </section>

                                <section className="modtools-box">
                                    <header><b>Preferências</b><small>salvas localmente</small></header>
                                    <label className="modtools-toggle"><span>Tema escuro</span><input type="checkbox" checked={ theme === 'escuro' } onChange={ event => setTheme(event.target.checked ? 'escuro' : 'claro') } /></label>
                                    <label className="modtools-toggle"><span>Modo discreto</span><input type="checkbox" checked={ discreet } onChange={ event => setDiscreet(event.target.checked) } /></label>
                                    <label className="modtools-toggle"><span>Sempre no topo</span><input type="checkbox" checked={ alwaysOnTop } onChange={ event => setAlwaysOnTop(event.target.checked) } /></label>
                                    <div className="modtools-backup-row"><button onClick={ exportSettings }>Exportar backup</button><button onClick={ () => importRef.current?.click() }>Importar</button><input ref={ importRef } className="d-none" type="file" accept="application/json" onChange={ importSettings } /></div>
                                </section>

                                <section className="modtools-box">
                                    <header><b>Monitorados</b><small>{ monitored.length }</small></header>
                                    <div className="modtools-list compact-list">{ monitored.slice(0, 5).map(item => <div key={ item.userId } className="modtools-row"><span><b>{ item.username }</b><small>#{ item.userId } · { item.reason }</small></span><button onClick={ () => setMonitored(previous => previous.filter(user => user.userId !== item.userId)) }>×</button></div>) }{ monitored.length === 0 && <p className="modtools-empty">Nenhum usuário monitorado.</p> }</div>
                                </section>

                                <section className="modtools-box shortcuts"><header><b>Atalhos</b></header><p><kbd>Alt+M</kbd> abrir · <kbd>Alt+T</kbd> tickets · <kbd>Alt+U</kbd> usuário · <kbd>Alt+R</kbd> sala · <kbd>Esc</kbd> recolher</p></section>
                            </> }
                        </div>
                        { confirmText && <div className="modtools-confirm-hint">{ confirmText }</div> }
                    </NitroCardContentView>
                </NitroCardView> }

            { toast && <div className="modtools-compact-toast">{ toast }</div> }
            { openRooms.map(roomId => <ModToolsRoomView key={ roomId } roomId={ roomId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-room-info/${ roomId }`) } />) }
            { openRoomChatlogs.map(roomId => <ModToolsChatlogView key={ roomId } roomId={ roomId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-room-chatlog/${ roomId }`) } />) }
            { openUserInfos.map(userId => <ModToolsUserView key={ userId } userId={ userId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-user-info/${ userId }`) } />) }
            { openUserChatlogs.map(userId => <ModToolsUserChatlogView key={ userId } userId={ userId } onCloseClick={ () => CreateLinkEvent(`mod-tools/close-user-chatlog/${ userId }`) } />) }
            { isTicketsVisible && <ModToolsTicketsView onCloseClick={ () => setIsTicketsVisible(false) } /> }
        </>
    );
};
