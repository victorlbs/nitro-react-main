import { GetOccupiedTilesMessageComposer, GetRoomEntryTileMessageComposer, NitroPoint, RoomEntryTileMessageEvent, RoomOccupiedTilesMessageEvent } from '@nitrots/nitro-renderer';
import { FC, useEffect, useRef, useState } from 'react';
import { FaArrowDown, FaArrowLeft, FaArrowRight, FaArrowUp } from 'react-icons/fa';
import { SendMessageComposer } from '../../../api';
import { Base, Button, Column, ColumnProps, Flex, Grid } from '../../../common';
import { useMessageEvent } from '../../../hooks';
import { FloorplanEditor } from '../common/FloorplanEditor';
import { useFloorplanEditorContext } from '../FloorplanEditorContext';

interface Props extends ColumnProps { zoom?: number; showGrid?: boolean; showHeights?: boolean; onCursorChange?(x:number,y:number,height:string):void; }

export const FloorplanCanvasView: FC<Props> = props =>
{
    const { gap=1, children=null, zoom=100, showGrid=true, showHeights=true, onCursorChange=null, ...rest } = props;
    const [ occupiedTilesReceived,setOccupiedTilesReceived ]=useState(false);
    const [ entryTileReceived,setEntryTileReceived ]=useState(false);
    const { originalFloorplanSettings=null,setOriginalFloorplanSettings=null,setVisualizationSettings=null }=useFloorplanEditorContext();
    const elementRef=useRef<HTMLDivElement>(null);

    useMessageEvent<RoomOccupiedTilesMessageEvent>(RoomOccupiedTilesMessageEvent,event=>{const parser=event.getParser();setOriginalFloorplanSettings(prev=>{const next={...prev,reservedTiles:parser.blockedTilesMap};FloorplanEditor.instance.setTilemap(next.tilemap,next.reservedTiles);return next;});setOccupiedTilesReceived(true);if(elementRef.current)elementRef.current.scrollTo((FloorplanEditor.instance.view.width/3),0);});
    useMessageEvent<RoomEntryTileMessageEvent>(RoomEntryTileMessageEvent,event=>{const parser=event.getParser();setOriginalFloorplanSettings(prev=>({...prev,entryPoint:[parser.x,parser.y],entryPointDir:parser.direction}));setVisualizationSettings(prev=>({...prev,entryPointDir:parser.direction}));FloorplanEditor.instance.doorLocation=new NitroPoint(parser.x,parser.y);setEntryTileReceived(true);});

    useEffect(()=>{const goto=(event:Event)=>{const detail=(event as CustomEvent).detail;if(!elementRef.current)return;const scale=zoom/100;elementRef.current.scrollTo({left:Math.max(0,(detail.x*32)*scale-150),top:Math.max(0,(detail.y*16)*scale-100),behavior:'smooth'});};window.addEventListener('floorplan-goto',goto);return()=>window.removeEventListener('floorplan-goto',goto);},[zoom]);

    useEffect(()=>{const el=elementRef.current;if(!el)return;const wheel=(event:WheelEvent)=>{if(event.ctrlKey){event.preventDefault();window.dispatchEvent(new CustomEvent('floorplan-zoom-delta',{detail:event.deltaY<0?25:-25}));return;}if(event.altKey){event.preventDefault();FloorplanEditor.instance.adjustHoveredHeight(event.deltaY<0?1:-1);}};el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);},[]);

    useEffect(()=>()=>{FloorplanEditor.instance.clear();setVisualizationSettings(prev=>({wallHeight:originalFloorplanSettings.wallHeight,thicknessWall:originalFloorplanSettings.thicknessWall,thicknessFloor:originalFloorplanSettings.thicknessFloor,entryPointDir:prev.entryPointDir}));},[originalFloorplanSettings.thicknessFloor,originalFloorplanSettings.thicknessWall,originalFloorplanSettings.wallHeight,setVisualizationSettings]);
    useEffect(()=>{if(entryTileReceived&&occupiedTilesReceived){FloorplanEditor.instance.renderTiles();FloorplanEditor.instance.pushHistory('Estado inicial');}},[entryTileReceived,occupiedTilesReceived]);
    useEffect(()=>{SendMessageComposer(new GetRoomEntryTileMessageComposer());SendMessageComposer(new GetOccupiedTilesMessageComposer());FloorplanEditor.instance.tilemapRenderer.interactive=true;if(elementRef.current&&!elementRef.current.contains(FloorplanEditor.instance.renderer.view))elementRef.current.appendChild(FloorplanEditor.instance.renderer.view);},[]);

    const scroll=(dir:string)=>{const el=elementRef.current;if(!el)return;const amount=80;if(dir==='up')el.scrollBy({top:-amount});if(dir==='down')el.scrollBy({top:amount});if(dir==='left')el.scrollBy({left:-amount});if(dir==='right')el.scrollBy({left:amount});};

    return <Column gap={gap} {...rest}>
        <Grid overflow="hidden" gap={1}>
            <Column center size={1}><Button className="d-md-none" onClick={()=>scroll('left')}><FaArrowLeft className="fa-icon"/></Button></Column>
            <Column overflow="hidden" size={10} gap={1}>
                <Flex justifyContent="center" className="d-md-none"><Button shrink onClick={()=>scroll('up')}><FaArrowUp className="fa-icon"/></Button></Flex>
                <Base overflow="auto" innerRef={elementRef} className={`fp-canvas-scroll ${showGrid?'show-grid':''} ${showHeights?'show-heights':''}`} style={{'--fp-zoom':zoom/100} as any}/>
                <Flex justifyContent="center" className="d-md-none"><Button shrink onClick={()=>scroll('down')}><FaArrowDown className="fa-icon"/></Button></Flex>
            </Column>
            <Column center size={1}><Button className="d-md-none" onClick={()=>scroll('right')}><FaArrowRight className="fa-icon"/></Button></Column>
        </Grid>{children}
    </Column>;
}
