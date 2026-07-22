import { ILinkEventTracker, RoomObjectCategory } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { AddEventLinkTracker, RemoveLinkEventTracker } from '../../api';
import { NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useObjectSelectedEvent } from '../../hooks';
import './WiredToolView.scss';

type WiredToolTab = 'variables' | 'inspection' | 'settings';
type VariableType = 'furni' | 'user' | 'room' | 'system';
type InspectionHolderType = 'furni' | 'user' | 'room';

interface WiredVariable
{
    name: string;
    type: VariableType;
    target: string;
    availability: string;
    hasValue: boolean;
    canWrite: boolean;
    canCreateDelete: boolean;
    textValues?: { value: string; text: string }[];
}

interface InspectionVariable
{
    variable: string;
    value: string;
}

interface WiredToolPhpResponse
{
    success: boolean;
    error?: string;
    holderType?: number;
    itemId?: number;
    classId?: number;
    itemName?: string;
    variables?: InspectionVariable[];
}

const EMPTY_INSPECTION_VARIABLES: InspectionVariable[] = [
    { variable: '@id', value: '' },
    { variable: '@class_id', value: '' },
    { variable: '@height', value: '' },
    { variable: '@state', value: '' },
    { variable: '@position_x', value: '' },
    { variable: '@position_y', value: '' },
    { variable: '@rotation', value: '' },
    { variable: '@altitude', value: '' },
    { variable: '@is_stackable', value: '' },
    { variable: '@can_stand_on', value: '' },
    { variable: '@x_dimension', value: '' },
    { variable: '@y_dimension', value: '' },
    { variable: '@owner_id', value: '' }
];

const VARIABLES: WiredVariable[] = [
    { name: '@id', type: 'furni', target: 'Furni', availability: '/', hasValue: true, canWrite: false, canCreateDelete: false },
    { name: '@class_id', type: 'furni', target: 'Furni', availability: '/', hasValue: true, canWrite: false, canCreateDelete: false },
    { name: '@base_item_id', type: 'furni', target: 'Furni', availability: '/', hasValue: true, canWrite: false, canCreateDelete: false },
    { name: '@height', type: 'furni', target: 'Furni', availability: '/', hasValue: true, canWrite: true, canCreateDelete: false },
    { name: '@state', type: 'furni', target: 'Furni', availability: '/', hasValue: true, canWrite: true, canCreateDelete: false },
    { name: '@position_x', type: 'furni', target: 'Furni', availability: '/', hasValue: true, canWrite: true, canCreateDelete: false },
    { name: '@position_y', type: 'furni', target: 'Furni', availability: '/', hasValue: true, canWrite: true, canCreateDelete: false },
    { name: '@rotation', type: 'furni', target: 'Furni', availability: '/', hasValue: true, canWrite: true, canCreateDelete: false },
    { name: '@altitude', type: 'furni', target: 'Furni', availability: '/', hasValue: true, canWrite: false, canCreateDelete: false },
    { name: '@username', type: 'user', target: 'User', availability: '/', hasValue: true, canWrite: false, canCreateDelete: false },
    { name: '@user_id', type: 'user', target: 'User', availability: '/', hasValue: true, canWrite: false, canCreateDelete: false },
    { name: '@room_id', type: 'room', target: 'Room', availability: '/', hasValue: true, canWrite: false, canCreateDelete: false },
    { name: '@time', type: 'system', target: 'Internal', availability: '/', hasValue: true, canWrite: false, canCreateDelete: false }
];

const TYPE_LABELS: Record<VariableType, string> = {
    furni: 'Furni',
    user: 'Usuário',
    room: 'Quarto',
    system: 'Sistema'
};

const PHP_ENDPOINT = '*/api_wired_tool_inspection.php';

export const WiredToolView: FC<{}> = () =>
{
    const [ isVisible, setIsVisible ] = useState(false);
    const [ activeTab, setActiveTab ] = useState<WiredToolTab>('inspection');
    const [ activeType, setActiveType ] = useState<VariableType>('furni');
    const [ selectedVariable, setSelectedVariable ] = useState<WiredVariable>(VARIABLES[0]);

    const [ inspectionHolderType, setInspectionHolderType ] = useState<InspectionHolderType>('furni');
    const [ keepSelected, setKeepSelected ] = useState(false);
    const [ inspectionItemId, setInspectionItemId ] = useState(0);
    const [ inspectionClassId, setInspectionClassId ] = useState(0);
    const [ inspectionItemName, setInspectionItemName ] = useState('Nenhum mobi selecionado');
    const [ inspectionVariables, setInspectionVariables ] = useState<InspectionVariable[]>(EMPTY_INSPECTION_VARIABLES);
    const [ isInspecting, setIsInspecting ] = useState(false);
    const [ inspectionError, setInspectionError ] = useState('');

    const filteredVariables = useMemo(() =>
    {
        return VARIABLES.filter(variable => variable.type === activeType);
    }, [ activeType ]);

    const inspectFurni = (itemId: number) =>
    {
        if(itemId <= 0) return;

        setActiveTab('inspection');
        setInspectionHolderType('furni');
        setInspectionItemId(itemId);
        setInspectionClassId(0);
        setInspectionItemName('Carregando...');
        setInspectionVariables(EMPTY_INSPECTION_VARIABLES);
        setInspectionError('');
        setIsInspecting(true);

        fetch(`${ PHP_ENDPOINT }?item_id=${ encodeURIComponent(itemId) }`, {
            method: 'GET',
            cache: 'no-store',
            credentials: 'same-origin'
        })
            .then(response => response.json())
            .then((data: WiredToolPhpResponse) =>
            {
                if(!data || !data.success)
                {
                    setInspectionItemName('Erro ao carregar');
                    setInspectionVariables(EMPTY_INSPECTION_VARIABLES);
                    setInspectionError(data && data.error ? data.error : 'Erro ao buscar dados do mobi.');
                    setIsInspecting(false);

                    return;
                }

                setInspectionItemId(Number(data.itemId || itemId));
                setInspectionClassId(Number(data.classId || 0));
                setInspectionItemName(String(data.itemName || 'Mobi'));
                setInspectionVariables(data.variables && data.variables.length ? data.variables : EMPTY_INSPECTION_VARIABLES);
                setInspectionHolderType(data.holderType === 1 ? 'user' : (data.holderType === 2 ? 'room' : 'furni'));
                setIsInspecting(false);
            })
            .catch(error =>
            {
                console.error('[WiredTool] Erro fetch PHP:', error);

                setInspectionItemName('Erro ao carregar');
                setInspectionVariables(EMPTY_INSPECTION_VARIABLES);
                setInspectionError('Falha ao chamar api_wired_tool_inspection.php.');
                setIsInspecting(false);
            });
    };

    const refreshInspection = () =>
    {
        if(inspectionItemId <= 0) return;

        inspectFurni(inspectionItemId);
    };

    const clearInspection = () =>
    {
        setInspectionItemId(0);
        setInspectionClassId(0);
        setInspectionItemName('Nenhum mobi selecionado');
        setInspectionVariables(EMPTY_INSPECTION_VARIABLES);
        setInspectionError('');
        setIsInspecting(false);
    };

    const changeType = (type: VariableType) =>
    {
        setActiveType(type);

        const firstVariable = VARIABLES.find(variable => variable.type === type);

        if(firstVariable) setSelectedVariable(firstVariable);
    };

    useObjectSelectedEvent(event =>
    {
        if(!isVisible) return;
        if(keepSelected && inspectionItemId > 0) return;

        const category = event.category;

        if(category !== RoomObjectCategory.FLOOR && category !== RoomObjectCategory.WALL) return;

        inspectFurni(event.id);
    });

    useEffect(() =>
    {
        const linkTracker: ILinkEventTracker = {
            linkReceived: (url: string) =>
            {
                const parts = url.split('/');

                if(parts.length < 2) return;

                switch(parts[1])
                {
                    case 'show':
                        setIsVisible(true);
                        return;
                    case 'hide':
                        setIsVisible(false);
                        return;
                    case 'toggle':
                        setIsVisible(prevValue => !prevValue);
                        return;
                    case 'inspection':
                        setIsVisible(true);
                        setActiveTab('inspection');
                        return;
                    case 'inspect':
                        setIsVisible(true);
                        setActiveTab('inspection');
                        inspectFurni(Number(parts[2] || 0));
                        return;
                }
            },
            eventUrlPrefix: 'wired-tool/'
        };

        AddEventLinkTracker(linkTracker);

        return () => RemoveLinkEventTracker(linkTracker);
    }, [ isVisible, keepSelected, inspectionItemId ]);

    if(!isVisible) return null;

    return (
        <NitroCardView uniqueKey="wired-tool" className="wired-tool-window" theme="primary-slim">
            <NitroCardHeaderView headerText="Wired Tool (:wiredtool)" onCloseClick={ () => setIsVisible(false) } />

            <NitroCardContentView className="wired-tool-content">
                <div className="wired-tool-tabs">
                    <button type="button" className={ activeTab === 'variables' ? 'active' : '' } onClick={ () => setActiveTab('variables') }>
                        Variables
                    </button>

                    <button type="button" className={ activeTab === 'inspection' ? 'active' : '' } onClick={ () => setActiveTab('inspection') }>
                        Inspection
                    </button>

                    <button type="button" className={ activeTab === 'settings' ? 'active' : '' } onClick={ () => setActiveTab('settings') }>
                        Settings
                    </button>
                </div>

                { activeTab === 'variables' &&
                    <>
                        <div className="wired-tool-banner">Variable Overview</div>

                        <div className="wired-tool-main">
                            <div className="wired-tool-left">
                                <div className="wired-tool-section-title">Variable type:</div>

                                <div className="wired-tool-type-buttons">
                                    <button type="button" className={ activeType === 'furni' ? 'active' : '' } onClick={ () => changeType('furni') }>▣</button>
                                    <button type="button" className={ activeType === 'user' ? 'active' : '' } onClick={ () => changeType('user') }>👤</button>
                                    <button type="button" className={ activeType === 'room' ? 'active' : '' } onClick={ () => changeType('room') }>🌐</button>
                                    <button type="button" className={ activeType === 'system' ? 'active' : '' } onClick={ () => changeType('system') }>🔧</button>
                                </div>

                                <div className="wired-tool-section-title mt">Variable picker:</div>

                                <div className="wired-tool-variable-list">
                                    { filteredVariables.map(variable =>
                                        <button
                                            type="button"
                                            key={ variable.name }
                                            className={ selectedVariable.name === variable.name ? 'active' : '' }
                                            onClick={ () => setSelectedVariable(variable) }
                                        >
                                            { variable.name }
                                        </button>
                                    ) }
                                </div>

                                <button type="button" className="wired-tool-disabled-button" disabled>
                                    Highlight holders
                                </button>
                            </div>

                            <div className="wired-tool-right">
                                <div className="wired-tool-section-title">Properties:</div>

                                <table className="wired-tool-properties">
                                    <thead>
                                        <tr>
                                            <th>Property</th>
                                            <th>Value</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <tr><td>Name</td><td>{ selectedVariable.name }</td></tr>
                                        <tr><td>Type</td><td>{ TYPE_LABELS[selectedVariable.type] }</td></tr>
                                        <tr><td>Target</td><td>{ selectedVariable.target }</td></tr>
                                        <tr><td>Availability</td><td>{ selectedVariable.availability }</td></tr>
                                        <tr><td>Has value</td><td>{ selectedVariable.hasValue ? 'Yes' : 'No' }</td></tr>
                                        <tr><td>Can write to</td><td>{ selectedVariable.canWrite ? 'Yes' : 'No' }</td></tr>
                                        <tr><td>Can create/delete</td><td>{ selectedVariable.canCreateDelete ? 'Yes' : 'No' }</td></tr>
                                    </tbody>
                                </table>

                                <div className="wired-tool-section-title mt">Text values:</div>

                                <table className="wired-tool-values">
                                    <thead>
                                        <tr>
                                            <th>Value</th>
                                            <th>Text</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        { selectedVariable.textValues && selectedVariable.textValues.length > 0 ? selectedVariable.textValues.map(item =>
                                            <tr key={ item.value }>
                                                <td>{ item.value }</td>
                                                <td>{ item.text }</td>
                                            </tr>
                                        ) :
                                            <tr>
                                                <td colSpan={ 2 } className="empty">Nenhum valor de texto.</td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                }

                { activeTab === 'inspection' &&
                    <>
                        <div className="wired-tool-banner">Variable Inspection</div>

                        <div className="wired-tool-inspection-main">
                            <div className="wired-tool-inspection-left">
                                <div className="wired-tool-section-title">Variable holder type:</div>

                                <div className="wired-tool-holder-buttons">
                                    <button type="button" className={ inspectionHolderType === 'furni' ? 'active' : '' } onClick={ () => setInspectionHolderType('furni') }>▣</button>
                                    <button type="button" className={ inspectionHolderType === 'user' ? 'active' : '' } onClick={ () => setInspectionHolderType('user') }>👤</button>
                                    <button type="button" className={ inspectionHolderType === 'room' ? 'active' : '' } onClick={ () => setInspectionHolderType('room') }>🌐</button>
                                </div>

                                <div className="wired-tool-section-title mt">Preview:</div>

                                <div className="wired-tool-inspection-preview">
                                    <div className="wired-tool-furni-preview-box">
                                        <div className="wired-tool-furni-icon">▣</div>
                                        <b>{ isInspecting ? 'Carregando...' : inspectionItemName }</b>
                                        { inspectionItemId > 0 && <small>ID { inspectionItemId }</small> }
                                        { inspectionClassId > 0 && <small>Class { inspectionClassId }</small> }
                                    </div>
                                </div>

                                { inspectionError && <div className="wired-tool-error">{ inspectionError }</div> }

                                <label className="wired-tool-keep-selected">
                                    <input type="checkbox" checked={ keepSelected } onChange={ event => setKeepSelected(event.target.checked) } />
                                    <span>Keep furni/user selected</span>
                                </label>

                                <div className="wired-tool-inspection-buttons">
                                    <button type="button" onClick={ refreshInspection } disabled={ inspectionItemId <= 0 || isInspecting }>Atualizar</button>
                                    <button type="button" onClick={ clearInspection }>Limpar</button>
                                </div>
                            </div>

                            <div className="wired-tool-inspection-right">
                                <div className="wired-tool-section-title">Variables:</div>

                                <table className="wired-tool-inspection-table">
                                    <thead>
                                        <tr>
                                            <th>Variable</th>
                                            <th>Value</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        { inspectionVariables.map(item =>
                                            <tr key={ item.variable }>
                                                <td>{ item.variable }</td>
                                                <td>{ item.value }</td>
                                            </tr>
                                        ) }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                }

                { activeTab === 'settings' &&
                    <div className="wired-tool-placeholder">
                        Esta versão usa PHP/DB. Não precisa registrar headers 4028/4029 no Nitro.
                        <br />
                        Endpoint: <b>{ PHP_ENDPOINT }</b>
                    </div>
                }
            </NitroCardContentView>
        </NitroCardView>
    );
};
