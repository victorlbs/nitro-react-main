import { FloorHeightMapEvent, ILinkEventTracker, NitroPoint, RoomEngineEvent, RoomVisualizationSettingsEvent, UpdateFloorPropertiesMessageComposer } from '@nitrots/nitro-renderer';
import { FC, useEffect, useMemo, useState } from 'react';
import { AddEventLinkTracker, LocalizeText, RemoveLinkEventTracker, SendMessageComposer } from '../../api';
import { Button, ButtonGroup, Flex, NitroCardContentView, NitroCardHeaderView, NitroCardView } from '../../common';
import { useMessageEvent, useRoomEngineEvent } from '../../hooks';
import { FloorplanEditor } from './common/FloorplanEditor';
import { IFloorplanSettings } from './common/IFloorplanSettings';
import { IVisualizationSettings } from './common/IVisualizationSettings';
import { convertNumbersForSaving, convertSettingToNumber } from './common/Utils';
import { FloorplanEditorContextProvider } from './FloorplanEditorContext';
import { FloorplanCanvasView } from './views/FloorplanCanvasView';
import { FloorplanImportExportView } from './views/FloorplanImportExportView';
import { FloorplanOptionsView } from './views/FloorplanOptionsView';
import { FloorplanProToolbarView } from './views/FloorplanProToolbarView';

const AUTOSAVE_KEY='nitro-floorplan-autosave';
const SAVED_MAPS_KEY='nitro-floorplan-saved-maps';

export const FloorplanEditorView: FC<{}> = () =>
{
    const [isVisible,setIsVisible]=useState(false);
    const [importExportVisible,setImportExportVisible]=useState(false);
    const [previewVisible,setPreviewVisible]=useState(false);
    const [historyVisible,setHistoryVisible]=useState(false);
    const [zoom,setZoom]=useState(100);
    const [showGrid,setShowGrid]=useState(true);
    const [showHeights,setShowHeights]=useState(true);
    const [nightMode,setNightMode]=useState(false);
    const [cursor,setCursor]=useState({x:-1,y:-1,height:'x'});
    const [version,setVersion]=useState(0);
    const [autosaveStatus,setAutosaveStatus]=useState('');
    const [originalFloorplanSettings,setOriginalFloorplanSettings]=useState<IFloorplanSettings>({tilemap:'',reservedTiles:[],entryPoint:[0,0],entryPointDir:2,wallHeight:-1,thicknessWall:1,thicknessFloor:1});
    const [visualizationSettings,setVisualizationSettings]=useState<IVisualizationSettings>({entryPointDir:2,wallHeight:-1,thicknessWall:1,thicknessFloor:1});
    const editor=FloorplanEditor.instance;
    const stats=useMemo(()=>editor.getStats(),[version]);

    const saveFloorChanges=()=>SendMessageComposer(new UpdateFloorPropertiesMessageComposer(editor.getCurrentTilemapString(),editor.doorLocation.x,editor.doorLocation.y,visualizationSettings.entryPointDir,convertNumbersForSaving(visualizationSettings.thicknessWall),convertNumbersForSaving(visualizationSettings.thicknessFloor),(visualizationSettings.wallHeight-1)));
    const revertChanges=()=>{if(!window.confirm('Descartar as alterações e recarregar o mapa recebido?'))return;setVisualizationSettings({wallHeight:originalFloorplanSettings.wallHeight,thicknessWall:originalFloorplanSettings.thicknessWall,thicknessFloor:originalFloorplanSettings.thicknessFloor,entryPointDir:originalFloorplanSettings.entryPointDir});editor.doorLocation=new NitroPoint(originalFloorplanSettings.entryPoint[0],originalFloorplanSettings.entryPoint[1]);editor.setTilemap(originalFloorplanSettings.tilemap,originalFloorplanSettings.reservedTiles);editor.renderTiles();setVersion(v=>v+1);};

    const saveAs=()=>{const name=window.prompt('Nome para este mapa:','Meu quarto');if(!name)return;let saved:Record<string,any>={};try{saved=JSON.parse(localStorage.getItem(SAVED_MAPS_KEY)||'{}');}catch{}saved[name]={map:editor.getCurrentTilemapString(),door:[editor.doorLocation.x,editor.doorLocation.y],settings:visualizationSettings,savedAt:Date.now()};localStorage.setItem(SAVED_MAPS_KEY,JSON.stringify(saved));setAutosaveStatus(`Salvo como “${name}”`);};

    useRoomEngineEvent<RoomEngineEvent>(RoomEngineEvent.DISPOSED,()=>setIsVisible(false));
    useMessageEvent<FloorHeightMapEvent>(FloorHeightMapEvent,event=>{const parser=event.getParser();setOriginalFloorplanSettings(prev=>({...prev,tilemap:parser.model,wallHeight:parser.wallHeight+1}));setVisualizationSettings(prev=>({...prev,wallHeight:parser.wallHeight+1}));});
    useMessageEvent<RoomVisualizationSettingsEvent>(RoomVisualizationSettingsEvent,event=>{const parser=event.getParser();const floor=convertSettingToNumber(parser.thicknessFloor),wall=convertSettingToNumber(parser.thicknessWall);setOriginalFloorplanSettings(prev=>({...prev,thicknessFloor:floor,thicknessWall:wall}));setVisualizationSettings(prev=>({...prev,thicknessFloor:floor,thicknessWall:wall}));});

    useEffect(()=>{const tracker:ILinkEventTracker={linkReceived:url=>{const p=url.split('/');if(p.length<2)return;if(p[1]==='show')setIsVisible(true);if(p[1]==='hide')setIsVisible(false);if(p[1]==='toggle')setIsVisible(v=>!v);},eventUrlPrefix:'floor-editor/'};AddEventLinkTracker(tracker);return()=>RemoveLinkEventTracker(tracker);},[]);
    useEffect(()=>{editor.initialize();editor.setCallbacks(()=>setVersion(v=>v+1),(x,y,height)=>setCursor({x,y,height}));},[]);
    useEffect(()=>{const fn=(e:Event)=>setZoom(z=>Math.max(25,Math.min(400,z+(e as CustomEvent).detail)));window.addEventListener('floorplan-zoom-delta',fn);return()=>window.removeEventListener('floorplan-zoom-delta',fn);},[]);

    useEffect(()=>{if(!isVisible)return;const timer=window.setInterval(()=>{const payload={map:editor.getCurrentTilemapString(),door:[editor.doorLocation.x,editor.doorLocation.y],settings:visualizationSettings,savedAt:Date.now()};localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(payload));setAutosaveStatus(`Salvo automaticamente às ${new Date().toLocaleTimeString()}`);},30000);return()=>window.clearInterval(timer);},[isVisible,visualizationSettings]);

    useEffect(()=>{if(!isVisible)return;const key=(e:KeyboardEvent)=>{const target=e.target as HTMLElement;if(target&&['INPUT','TEXTAREA','SELECT'].includes(target.tagName))return;const k=e.key.toLowerCase();if(e.ctrlKey&&k==='z'){e.preventDefault();editor.undo();}else if(e.ctrlKey&&(k==='y'||(e.shiftKey&&k==='z'))){e.preventDefault();editor.redo();}else if(e.ctrlKey&&k==='c'){e.preventDefault();editor.copySelection();}else if(e.ctrlKey&&k==='x'){e.preventDefault();editor.cutSelection();}else if(e.ctrlKey&&k==='v'){e.preventDefault();editor.pasteSelection();}else if(k==='delete'){editor.deleteSelection();}else if(k==='b'){editor.actionSettings.currentAction=3;}else if(k==='e'){editor.actionSettings.currentAction=4;}else if(k==='g'){editor.actionSettings.currentAction=7;}else if(k==='l'){editor.actionSettings.currentAction=5;}else if(k==='r'){editor.actionSettings.currentAction=6;}else if(k==='s'&&!e.ctrlKey){editor.actionSettings.currentAction=8;}else if(k==='p'){setPreviewVisible(true);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[isVisible]);

    const previewRows=useMemo(()=>previewVisible ? editor.getCurrentTilemapString().split('\r').slice(0,40) : [],[version,previewVisible,editor]);

    return <FloorplanEditorContextProvider value={{originalFloorplanSettings,setOriginalFloorplanSettings,visualizationSettings,setVisualizationSettings}}>
        {isVisible&&<NitroCardView uniqueKey="floorpan-editor" className={`nitro-floorplan-editor floorplan-pro ${nightMode?'night-mode':''}`} theme="primary-slim">
            <NitroCardHeaderView headerText={LocalizeText('floor.plan.editor.title')} onCloseClick={()=>setIsVisible(false)}/>
            <NitroCardContentView overflow="hidden">
                <FloorplanProToolbarView zoom={zoom} setZoom={setZoom} showGrid={showGrid} setShowGrid={setShowGrid} showHeights={showHeights} setShowHeights={setShowHeights} nightMode={nightMode} setNightMode={setNightMode} onPreview={()=>setPreviewVisible(true)} onSaveAs={saveAs} onImportExport={()=>setImportExportVisible(true)}/>
                <details className="fp-original-options"><summary>Configurações da sala (paredes, piso e porta)</summary><FloorplanOptionsView/></details>
                <FloorplanCanvasView overflow="hidden" zoom={zoom} showGrid={showGrid} showHeights={showHeights} onCursorChange={(x,y,height)=>setCursor({x,y,height})}/>
                <div className="fp-statusbar"><span>X: {cursor.x}</span><span>Y: {cursor.y}</span><span>Altura: {cursor.height==='x'?'vazio':parseInt(cursor.height,36)}</span><span>Zoom: {zoom}%</span><span>{stats.tiles} tiles</span><span>{stats.width}×{stats.height}</span><button onClick={()=>setHistoryVisible(true)}>Histórico</button><span className="fp-autosave">{autosaveStatus}</span></div>
                <Flex className="fp-builder-footer" justifyContent="between"><Button onClick={revertChanges}>Descartar</Button><ButtonGroup><Button onClick={()=>setPreviewVisible(true)}>Conferir</Button><Button onClick={()=>setImportExportVisible(true)}>Importar</Button><Button onClick={saveFloorChanges}>Salvar no quarto</Button></ButtonGroup></Flex>
            </NitroCardContentView>
        </NitroCardView>}
        {importExportVisible&&<FloorplanImportExportView onCloseClick={()=>setImportExportVisible(false)}/>} 
        {previewVisible&&<NitroCardView theme="primary-slim" className="fp-preview-window"><NitroCardHeaderView headerText="Pré-visualização do mapa" onCloseClick={()=>setPreviewVisible(false)}/><NitroCardContentView><div className="fp-preview-map">{previewRows.map((row,y)=><div key={y}>{row.split('').map((h,x)=><i key={x} className={h==='x'?'empty':''} title={`X ${x}, Y ${y}, altura ${h}`}>{h==='x'?'':parseInt(h,36)}</i>)}</div>)}</div><Flex justifyContent="between"><span>{stats.width}×{stats.height} • {stats.tiles} pisos</span><Button onClick={saveFloorChanges}>Salvar no quarto</Button></Flex></NitroCardContentView></NitroCardView>}
        {historyVisible&&<NitroCardView theme="primary-slim" className="fp-history-window"><NitroCardHeaderView headerText="Histórico de ações" onCloseClick={()=>setHistoryVisible(false)}/><NitroCardContentView><div className="fp-history-list">{editor.getHistory().map((item,i)=><div key={`${item.time}-${i}`}><b>{item.label}</b><span>{new Date(item.time).toLocaleTimeString()}</span></div>)}</div><Flex justifyContent="between"><Button onClick={()=>editor.undo()}>Desfazer</Button><Button onClick={()=>editor.redo()}>Refazer</Button></Flex></NitroCardContentView></NitroCardView>}
    </FloorplanEditorContextProvider>;
}
