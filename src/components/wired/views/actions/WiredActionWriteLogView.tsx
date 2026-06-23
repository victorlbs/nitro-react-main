import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredActionBaseView } from './WiredActionBaseView';

type WiredLogLevel = 0 | 1 | 2;

type WiredLogEntry = {
    id: string;
    level: WiredLogLevel;
    message: string;
    createdAt: number;
    source: 'frontend' | 'emulator' | 'manual';
};

declare global {
    interface Window {
        __nitroWiredLogPush?: (level: number, message: string, source?: WiredLogEntry['source']) => void;
    }
}

const WIRED_LOG_STORAGE_KEY = 'nitro.wired.write_log.entries';
const MAX_LOG_ENTRIES = 200;

const LOG_LEVEL_LABELS: Record<WiredLogLevel, string> = {
    0: 'Informação',
    1: 'Aviso',
    2: 'Erro'
};

const LOG_LEVEL_BADGE_CLASS: Record<WiredLogLevel, string> = {
    0: 'bg-info',
    1: 'bg-warning text-dark',
    2: 'bg-danger'
};

const LOG_LEVEL_TEXT_CLASS: Record<WiredLogLevel, string> = {
    0: 'text-info',
    1: 'text-warning',
    2: 'text-danger'
};

const normalizeLogLevel = (value: number): WiredLogLevel => {
    if (value <= 0) return 0;
    if (value === 1) return 1;

    return 2;
};

const createLogId = (): string => {
    return `${ Date.now().toString(36) }-${ Math.random().toString(36).slice(2, 10) }`;
};

const sanitizeMessage = (value: string): string => {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 512);
};

const isValidLogEntry = (entry: unknown): entry is WiredLogEntry => {
    if (!entry || typeof entry !== 'object') return false;

    const data = entry as WiredLogEntry;

    return (
        typeof data.id === 'string' &&
        typeof data.message === 'string' &&
        typeof data.createdAt === 'number' &&
        (data.level === 0 || data.level === 1 || data.level === 2) &&
        (data.source === 'frontend' || data.source === 'emulator' || data.source === 'manual')
    );
};

const readStoredLogs = (): WiredLogEntry[] => {
    try {
        const raw = localStorage.getItem(WIRED_LOG_STORAGE_KEY);

        if (!raw) return [];

        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter(isValidLogEntry)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, MAX_LOG_ENTRIES);
    }
    catch {
        return [];
    }
};

const writeStoredLogs = (entries: WiredLogEntry[]): void => {
    try {
        const normalized = entries
            .filter(isValidLogEntry)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, MAX_LOG_ENTRIES);

        localStorage.setItem(WIRED_LOG_STORAGE_KEY, JSON.stringify(normalized));
    }
    catch {
        // Evita quebrar a UI caso o navegador bloqueie localStorage.
    }
};

const formatLogDate = (timestamp: number): string => {
    try {
        return new Date(timestamp).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
    catch {
        return '-';
    }
};

/**
 * React view for the "Escrever nos logs" wired effect.
 *
 * Esta versão inclui um visualizador local de logs dentro do próprio Wired.
 * Os logs ficam salvos no localStorage do navegador.
 *
 * Para integração real com logs vindos do emulador, depois adicione um packet:
 * - RequestWiredLogsEvent
 * - WiredLogsComposer
 * - WiredLogManager no Arcturus
 */
export const WiredActionWriteLogView: FC<{}> = () => {
    const [ logLevel, setLogLevel ] = useState<WiredLogLevel>(0);
    const [ message, setMessage ] = useState('');
    const [ logs, setLogs ] = useState<WiredLogEntry[]>([]);
    const [ isViewerOpen, setIsViewerOpen ] = useState(false);
    const [ filterLevel, setFilterLevel ] = useState<'all' | WiredLogLevel>('all');
    const [ copied, setCopied ] = useState(false);

    const { trigger = null, setStringParam = null, setIntParams = null } = useWired();

    const refreshLogs = useCallback(() => {
        setLogs(readStoredLogs());
    }, []);

    const pushLog = useCallback((level: number, rawMessage: string, source: WiredLogEntry['source'] = 'manual') => {
        const safeMessage = sanitizeMessage(rawMessage);

        if (!safeMessage) return;

        const entry: WiredLogEntry = {
            id: createLogId(),
            level: normalizeLogLevel(level),
            message: safeMessage,
            createdAt: Date.now(),
            source
        };

        const nextLogs = [ entry, ...readStoredLogs() ].slice(0, MAX_LOG_ENTRIES);

        writeStoredLogs(nextLogs);
        setLogs(nextLogs);
    }, []);

    useEffect(() => {
        refreshLogs();
    }, [ refreshLogs ]);

    useEffect(() => {
        if (!trigger) return;

        setMessage(trigger.stringData || '');

        if (trigger.intData && trigger.intData.length > 0) {
            const level = Number(trigger.intData[0]);

            if (!Number.isNaN(level)) setLogLevel(normalizeLogLevel(level));
        }
    }, [ trigger ]);

    useEffect(() => {
        window.__nitroWiredLogPush = (level: number, rawMessage: string, source: WiredLogEntry['source'] = 'emulator') => {
            pushLog(level, rawMessage, source);
        };

        const onExternalLog = (event: Event) => {
            const customEvent = event as CustomEvent<{ level?: number; message?: string; source?: WiredLogEntry['source'] }>;

            if (!customEvent.detail) return;

            pushLog(
                Number(customEvent.detail.level || 0),
                String(customEvent.detail.message || ''),
                customEvent.detail.source || 'emulator'
            );
        };

        window.addEventListener('nitro:wired-log', onExternalLog);

        return () => {
            delete window.__nitroWiredLogPush;
            window.removeEventListener('nitro:wired-log', onExternalLog);
        };
    }, [ pushLog ]);

    const filteredLogs = useMemo(() => {
        if (filterLevel === 'all') return logs;

        return logs.filter(entry => entry.level === filterLevel);
    }, [ logs, filterLevel ]);

    const save = () => {
        const safeMessage = sanitizeMessage(message);

        if (setStringParam) setStringParam(safeMessage);
        if (setIntParams) setIntParams([ logLevel ]);

        setMessage(safeMessage);
    };

    const handleChangeLevel = (value: number) => {
        setLogLevel(normalizeLogLevel(value));
    };

    const onViewLogs = () => {
        refreshLogs();
        setIsViewerOpen(true);
        setCopied(false);
    };

    const onCloseViewer = () => {
        setIsViewerOpen(false);
        setCopied(false);
    };

    const onClearLogs = () => {
        writeStoredLogs([]);
        setLogs([]);
        setCopied(false);
    };

    const onAddPreviewLog = () => {
        const safeMessage = sanitizeMessage(message);

        if (!safeMessage) return;

        pushLog(logLevel, safeMessage, 'frontend');
        setIsViewerOpen(true);
    };

    const onCopyLogs = async () => {
        const text = filteredLogs
            .map(entry => {
                return `[${ formatLogDate(entry.createdAt) }] [${ LOG_LEVEL_LABELS[entry.level] }] [${ entry.source }] ${ entry.message }`;
            })
            .join('\n');

        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        }
        catch {
            setCopied(false);
        }
    };

    return (
        <WiredActionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }
        >
            <Column gap={ 2 }>
                <Column gap={ 1 }>
                    <Text bold>Nível de log</Text>

                    <select
                        className="form-select form-select-sm"
                        value={ logLevel }
                        onChange={ event => handleChangeLevel(parseInt(event.target.value) || 0) }
                    >
                        <option value={ 0 }>Informação</option>
                        <option value={ 1 }>Aviso</option>
                        <option value={ 2 }>Erro</option>
                    </select>
                </Column>

                <Column gap={ 1 }>
                    <Text bold>Mensagem</Text>

                    <input
                        type="text"
                        className="form-control form-control-sm"
                        value={ message }
                        onChange={ event => setMessage(event.target.value) }
                        maxLength={ 512 }
                        placeholder="Texto do log"
                    />
                </Column>

                <div className="d-flex gap-2 align-items-center flex-wrap">
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={ onViewLogs }
                    >
                        Ver logs
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={ onAddPreviewLog }
                        disabled={ !sanitizeMessage(message) }
                    >
                        Testar log
                    </button>

                    <Text small className="text-muted">
                        { logs.length } registro{ logs.length === 1 ? '' : 's' }
                    </Text>
                </div>

                { isViewerOpen &&
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{
                            zIndex: 9999,
                            background: 'rgba(0, 0, 0, 0.55)'
                        }}
                    >
                        <div
                            className="bg-white rounded shadow-lg"
                            style={{
                                width: 'min(720px, calc(100vw - 24px))',
                                maxHeight: 'calc(100vh - 48px)',
                                overflow: 'hidden'
                            }}
                        >
                            <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                                <div>
                                    <Text bold>Visualizador de logs Wired</Text>
                                    <div className="text-muted small">
                                        Logs locais do efeito “Escrever nos logs”
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Fechar"
                                    onClick={ onCloseViewer }
                                />
                            </div>

                            <div className="px-3 py-2 border-bottom">
                                <div className="d-flex gap-2 align-items-center flex-wrap">
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ width: 170 }}
                                        value={ filterLevel }
                                        onChange={ event => {
                                            const value = event.target.value;

                                            setCopied(false);

                                            if (value === 'all') {
                                                setFilterLevel('all');

                                                return;
                                            }

                                            setFilterLevel(normalizeLogLevel(parseInt(value)));
                                        } }
                                    >
                                        <option value="all">Todos os níveis</option>
                                        <option value={ 0 }>Informação</option>
                                        <option value={ 1 }>Aviso</option>
                                        <option value={ 2 }>Erro</option>
                                    </select>

                                    <button
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={ refreshLogs }
                                    >
                                        Atualizar
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={ onCopyLogs }
                                        disabled={ filteredLogs.length === 0 }
                                    >
                                        Copiar
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={ onClearLogs }
                                        disabled={ logs.length === 0 }
                                    >
                                        Limpar
                                    </button>

                                    { copied &&
                                        <Text small className="text-success">
                                            Copiado.
                                        </Text>
                                    }
                                </div>
                            </div>

                            <div
                                className="p-3"
                                style={{
                                    maxHeight: '420px',
                                    overflowY: 'auto',
                                    background: '#f8f9fa'
                                }}
                            >
                                { filteredLogs.length === 0 &&
                                    <div className="text-center text-muted py-4">
                                        Nenhum log encontrado.
                                    </div>
                                }

                                { filteredLogs.map(entry => (
                                    <div
                                        key={ entry.id }
                                        className="bg-white border rounded p-2 mb-2"
                                    >
                                        <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className={ `badge ${ LOG_LEVEL_BADGE_CLASS[entry.level] }` }>
                                                    { LOG_LEVEL_LABELS[entry.level] }
                                                </span>

                                                <span className="text-muted small">
                                                    { formatLogDate(entry.createdAt) }
                                                </span>
                                            </div>

                                            <span className="text-muted small">
                                                { entry.source }
                                            </span>
                                        </div>

                                        <div
                                            className={ LOG_LEVEL_TEXT_CLASS[entry.level] }
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word'
                                            }}
                                        >
                                            { entry.message }
                                        </div>
                                    </div>
                                )) }
                            </div>
                        </div>
                    </div>
                }
            </Column>
        </WiredActionBaseView>
    );
};
