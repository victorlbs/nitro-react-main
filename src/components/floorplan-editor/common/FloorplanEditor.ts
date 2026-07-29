import { GetAssetManager, IGraphicAssetCollection, NitroPoint, NitroTilemap, PixiApplicationProxy, PixiInteractionEventProxy, POINT_STRUCT_SIZE } from '@nitrots/nitro-renderer';
import { ActionSettings } from './ActionSettings';
import { FloorAction, HEIGHT_SCHEME, MAX_NUM_TILE_PER_AXIS, TILE_SIZE } from './Constants';
import { Tile } from './Tile';
import { getScreenPositionForTile, getTileFromScreenPosition } from './Utils';

type Selection = { x1: number; y1: number; x2: number; y2: number };
type Snapshot = { map: string; doorX: number; doorY: number; label: string; time: number };

export class FloorplanEditor extends PixiApplicationProxy
{
    private static _INSTANCE: FloorplanEditor = null;
    public static readonly TILE_BLOCKED = 'r_blocked';
    public static readonly TILE_DOOR = 'r_door';

    private _tilemap: Tile[][] = [];
    private _width = 0;
    private _height = 0;
    private _isHolding = false;
    private _doorLocation = new NitroPoint(0, 0);
    private _lastUsedTile = new NitroPoint(-1, -1);
    private _tilemapRenderer: NitroTilemap;
    private _actionSettings = new ActionSettings();
    private _isInitialized = false;
    private _assetCollection: IGraphicAssetCollection;
    private _history: Snapshot[] = [];
    private _historyIndex = -1;
    private _redoHistory: Snapshot[] = [];
    private _anchor: NitroPoint = null;
    private _selection: Selection = null;
    private _clipboard: string[][] = null;
    private _cursor = new NitroPoint(-1, -1);
    private _onChange: (() => void) = null;
    private _onCursor: ((x: number, y: number, height: string) => void) = null;

    constructor()
    {
        super({ width: TILE_SIZE * MAX_NUM_TILE_PER_AXIS + 20, height: (TILE_SIZE * MAX_NUM_TILE_PER_AXIS) / 2 + 100, backgroundColor: 0x000000, antialias: true, autoDensity: true, resolution: 1, sharedLoader: true, sharedTicker: true });
    }

    public initialize(): void
    {
        if(this._isInitialized) return;
        const collection = GetAssetManager().getCollection('floor_editor');
        if(!collection) return;
        this._assetCollection = collection;
        this._tilemapRenderer = new NitroTilemap(collection.baseTexture);
        this.registerEventListeners();
        this.stage.addChild(this._tilemapRenderer);
        this._isInitialized = true;
    }

    public setCallbacks(onChange: () => void, onCursor: (x: number, y: number, height: string) => void): void
    {
        this._onChange = onChange;
        this._onCursor = onCursor;
    }

    private registerEventListeners(): void
    {
        const tempPoint = new NitroPoint();
        // @ts-ignore
        this._tilemapRenderer.containsPoint = position => { this._tilemapRenderer.worldTransform.applyInverse(position, tempPoint); return this.tileHitDetection(tempPoint, false); };
        this._tilemapRenderer.on('pointerup', () => { this._isHolding = false; this._lastUsedTile.set(-1, -1); });
        this._tilemapRenderer.on('pointerout', () => { this._isHolding = false; });
        this._tilemapRenderer.on('pointermove', (event: PixiInteractionEventProxy) => this.tileHitDetection(event.data.global, false, false, true));
        this._tilemapRenderer.on('pointerdown', (event: PixiInteractionEventProxy) =>
        {
            const original = event.data.originalEvent;
            if(!(original instanceof PointerEvent) && !(original instanceof TouchEvent)) return;
            if((original instanceof MouseEvent) && original.button === 2) return;
            this.tileHitDetection(event.data.global, true);
        });
        this._tilemapRenderer.on('click', (event: PixiInteractionEventProxy) =>
        {
            if(!(event.data.originalEvent instanceof PointerEvent) || event.data.originalEvent.button === 2) return;
            this.tileHitDetection(event.data.global, true, true);
        });
    }

    private tileHitDetection(point: NitroPoint, setHolding: boolean, isClick = false, hoverOnly = false): boolean
    {
        // @ts-ignore
        const buffer = this._tilemapRenderer.pointsBuf;
        const len = buffer.length;
        if(setHolding) this._isHolding = true;
        for(let j = 0; j < len; j += POINT_STRUCT_SIZE)
        {
            const data = buffer.slice(j, j + POINT_STRUCT_SIZE);
            const dx = Math.abs(Math.floor(point.x) - (data[2] + TILE_SIZE / 2));
            const dy = Math.abs(Math.floor(point.y) - (data[3] + TILE_SIZE / 4));
            if((dx / (TILE_SIZE * .5) + dy / ((TILE_SIZE / 2) * .5)) <= 1)
            {
                const [ x, y ] = getTileFromScreenPosition(data[2], data[3]);
                if(x < 0 || y < 0 || y >= this._tilemap.length || x >= this._tilemap[y].length) return true;
                this._cursor.set(x, y);
                if(this._onCursor) this._onCursor(x, y, this._tilemap[y][x].height);
                if(hoverOnly) return true;
                if(this._isHolding)
                {
                    const isShape = [ FloorAction.LINE, FloorAction.RECTANGLE, FloorAction.FILL, FloorAction.SELECT, FloorAction.DOOR ].includes(this._actionSettings.currentAction);
                    if(isClick || !isShape)
                    {
                        if(isClick || this._lastUsedTile.x !== x || this._lastUsedTile.y !== y)
                        {
                            this._lastUsedTile.set(x, y);
                            this.onClick(x, y);
                        }
                    }
                }
                return true;
            }
        }
        return false;
    }

    private applyHeight(x: number, y: number, height: string): void
    {
        if(x < 0 || y < 0 || y >= MAX_NUM_TILE_PER_AXIS || x >= MAX_NUM_TILE_PER_AXIS) return;
        const tile = this._tilemap[y] && this._tilemap[y][x];
        if(!tile || tile.isBlocked) return;
        tile.height = height;
        if(height !== 'x') { this._width = Math.max(this._width, x + 1); this._height = Math.max(this._height, y + 1); }
    }

    private onClick(x: number, y: number): void
    {
        const tile = this._tilemap[y][x];
        if(!tile || tile.isBlocked) return;
        const action = this._actionSettings.currentAction;
        if(action === FloorAction.DOOR)
        {
            if(tile.height !== 'x') { this.pushHistory('Mover entrada'); this._doorLocation.set(x, y); this.changed(); }
            return;
        }
        if(action === FloorAction.FILL) { this.pushHistory('Preenchimento'); this.floodFill(x, y, this._actionSettings.currentHeight); this.changed(); return; }
        if(action === FloorAction.LINE || action === FloorAction.RECTANGLE || action === FloorAction.SELECT)
        {
            if(!this._anchor) { this._anchor = new NitroPoint(x, y); this._selection = { x1: x, y1: y, x2: x, y2: y }; this.notify(); return; }
            const start = this._anchor; this._anchor = null;
            if(action === FloorAction.SELECT) { this._selection = this.normalizeSelection(start.x, start.y, x, y); this.notify(); return; }
            this.pushHistory(action === FloorAction.LINE ? 'Linha' : 'Retângulo');
            if(action === FloorAction.LINE) this.drawLine(start.x, start.y, x, y, this._actionSettings.currentHeight);
            else this.drawRectangle(start.x, start.y, x, y, this._actionSettings.currentHeight);
            this.changed(); return;
        }
        this.pushHistory(action === FloorAction.UNSET ? 'Borracha' : action === FloorAction.UP ? 'Aumentar altura' : action === FloorAction.DOWN ? 'Diminuir altura' : 'Pincel');
        const index = HEIGHT_SCHEME.indexOf(tile.height);
        let newHeight = this._actionSettings.currentHeight;
        if(action === FloorAction.UNSET) newHeight = 'x';
        if(action === FloorAction.UP) newHeight = HEIGHT_SCHEME[Math.min(HEIGHT_SCHEME.length - 1, Math.max(1, index + 1))];
        if(action === FloorAction.DOWN) newHeight = HEIGHT_SCHEME[Math.max(1, index - 1)];
        this.applyHeight(x, y, newHeight);
        if(this._actionSettings.symmetry) this.applyHeight(Math.max(0, this._width - 1 - x), y, newHeight);
        this.changed();
    }

    private normalizeSelection(x1: number, y1: number, x2: number, y2: number): Selection
    { return { x1: Math.min(x1, x2), y1: Math.min(y1, y2), x2: Math.max(x1, x2), y2: Math.max(y1, y2) }; }

    private drawLine(x0: number, y0: number, x1: number, y1: number, height: string): void
    {
        let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
        while(true) { this.applyHeight(x0, y0, height); if(x0 === x1 && y0 === y1) break; const e2 = 2 * err; if(e2 >= dy) { err += dy; x0 += sx; } if(e2 <= dx) { err += dx; y0 += sy; } }
    }

    private drawRectangle(x1: number, y1: number, x2: number, y2: number, height: string): void
    { const s = this.normalizeSelection(x1, y1, x2, y2); for(let y = s.y1; y <= s.y2; y++) for(let x = s.x1; x <= s.x2; x++) this.applyHeight(x, y, height); }

    private floodFill(x: number, y: number, replacement: string): void
    {
        const target = this._tilemap[y][x].height; if(target === replacement) return;
        const queue: Array<[number, number]> = [[x, y]]; const seen = new Set<string>();
        while(queue.length) { const [cx, cy] = queue.shift(); const key = `${cx}:${cy}`; if(seen.has(key) || cx < 0 || cy < 0 || cx >= MAX_NUM_TILE_PER_AXIS || cy >= MAX_NUM_TILE_PER_AXIS) continue; seen.add(key); const t = this._tilemap[cy][cx]; if(!t || t.isBlocked || t.height !== target) continue; this.applyHeight(cx, cy, replacement); queue.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]); }
    }

    public copySelection(): boolean
    {
        if(!this._selection) return false; const s = this._selection; this._clipboard = [];
        for(let y=s.y1; y<=s.y2; y++) this._clipboard.push(this._tilemap[y].slice(s.x1,s.x2+1).map(t=>t.height)); return true;
    }
    public cutSelection(): boolean { if(!this.copySelection()) return false; this.pushHistory('Recortar'); this.deleteSelection(); return true; }
    public pasteSelection(): boolean
    {
        if(!this._clipboard) return false; const x0 = this._cursor.x >= 0 ? this._cursor.x : 0, y0 = this._cursor.y >= 0 ? this._cursor.y : 0; this.pushHistory('Colar');
        this._clipboard.forEach((row,y)=>row.forEach((h,x)=>this.applyHeight(x0+x,y0+y,h))); this._selection={x1:x0,y1:y0,x2:x0+this._clipboard[0].length-1,y2:y0+this._clipboard.length-1}; this.changed(); return true;
    }
    public deleteSelection(): boolean { if(!this._selection) return false; const s=this._selection; for(let y=s.y1;y<=s.y2;y++)for(let x=s.x1;x<=s.x2;x++)this.applyHeight(x,y,'x'); this.changed(); return true; }
    public mirrorSelection(horizontal=true): boolean
    {
        if(!this._selection) return false; this.pushHistory(horizontal?'Espelhar horizontal':'Espelhar vertical'); const s=this._selection; const data:string[][]=[]; for(let y=s.y1;y<=s.y2;y++)data.push(this._tilemap[y].slice(s.x1,s.x2+1).map(t=>t.height)); if(horizontal)data.forEach(r=>r.reverse());else data.reverse(); data.forEach((r,y)=>r.forEach((h,x)=>this.applyHeight(s.x1+x,s.y1+y,h))); this.changed(); return true;
    }
    public rotateSelection(): boolean
    {
        if(!this._selection) return false; this.pushHistory('Rotacionar 90°'); const s=this._selection; const data:string[][]=[]; for(let y=s.y1;y<=s.y2;y++)data.push(this._tilemap[y].slice(s.x1,s.x2+1).map(t=>t.height)); const rotated=data[0].map((_,i)=>data.map(r=>r[i]).reverse()); for(let y=s.y1;y<=s.y2;y++)for(let x=s.x1;x<=s.x2;x++)this.applyHeight(x,y,'x'); rotated.forEach((r,y)=>r.forEach((h,x)=>this.applyHeight(s.x1+x,s.y1+y,h))); this._selection={x1:s.x1,y1:s.y1,x2:s.x1+rotated[0].length-1,y2:s.y1+rotated.length-1}; this.changed(); return true;
    }

    public adjustHoveredHeight(delta: number): void
    {
        if(this._cursor.x < 0) return; const tile=this._tilemap[this._cursor.y][this._cursor.x]; if(!tile || tile.height==='x') return; this.pushHistory(delta>0?'Altura +':'Altura -'); const i=HEIGHT_SCHEME.indexOf(tile.height); this.applyHeight(this._cursor.x,this._cursor.y,HEIGHT_SCHEME[Math.max(1,Math.min(HEIGHT_SCHEME.length-1,i+delta))]); this.changed();
    }

    public pushHistory(label: string): void
    {
        const snapshot={ map:this.getCurrentTilemapStringSafe(), doorX:this._doorLocation.x, doorY:this._doorLocation.y, label, time:Date.now() };
        const current=this._history[this._history.length-1]; if(current && current.map===snapshot.map && current.doorX===snapshot.doorX && current.doorY===snapshot.doorY) return;
        this._history.push(snapshot); if(this._history.length>200)this._history.shift(); this._historyIndex=this._history.length-1; this._redoHistory=[]; this.notify();
    }
    public undo(): boolean
    {
        if(!this._history.length)return false;
        this._redoHistory.push({map:this.getCurrentTilemapStringSafe(),doorX:this._doorLocation.x,doorY:this._doorLocation.y,label:'Refazer',time:Date.now()});
        const snap=this._history.pop(); this._historyIndex=this._history.length-1; this.restoreSnapshot(snap); return true;
    }
    public redo(): boolean
    {
        if(!this._redoHistory.length)return false;
        this._history.push({map:this.getCurrentTilemapStringSafe(),doorX:this._doorLocation.x,doorY:this._doorLocation.y,label:'Desfazer',time:Date.now()});
        const snap=this._redoHistory.pop(); this._historyIndex=this._history.length-1; this.restoreSnapshot(snap); return true;
    }
    private restoreSnapshot(s: Snapshot): void { const blocked=this._tilemap.map(r=>r.map(t=>t.isBlocked)); this.setTilemap(s.map,blocked); this._doorLocation.set(s.doorX,s.doorY); this.changed(false); }
    public getHistory(): Snapshot[] { return this._history.slice().reverse(); }

    public applyTemplate(name: string): void
    {
        const templates:Record<string,string>={
            '20x20':Array(20).fill('0'.repeat(20)).join('\r'), '30x30':Array(30).fill('0'.repeat(30)).join('\r'),
            cassino:Array(18).fill('x00'.padEnd(24,'0')+'00x').join('\r'), loja:Array(16).fill('0'.repeat(22)).join('\r'),
            labirinto:Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>(x%4===0&&y%4!==1)||(y%4===0&&x%4!==1)?'x':'0').join('')).join('\r')
        };
        const map=templates[name]; if(!map)return; this.pushHistory(`Template ${name}`); this.setTilemap(map,[]); this._doorLocation.set(0,0); this.changed();
    }

    public renderTiles(): void
    {
        if(!this._tilemapRenderer || !this._assetCollection) return; this._tilemapRenderer.clear();
        for(let y=0;y<this._tilemap.length;y++)for(let x=0;x<this._tilemap[y].length;x++) { const tile=this._tilemap[y][x]; let asset=tile.height; if(this._doorLocation.x===x&&this._doorLocation.y===y)asset=FloorplanEditor.TILE_DOOR; if(tile.isBlocked)asset=FloorplanEditor.TILE_BLOCKED; const [px,py]=getScreenPositionForTile(x,y); const texture=this._assetCollection.getTexture(`floor_editor_${asset}`); if(texture)this._tilemapRenderer.tile(texture,px,py); }
    }
    private changed(render=true):void { if(render)this.renderTiles(); this.notify(); }
    private notify():void { if(this._onChange)this._onChange(); }

    public setTilemap(map:string, blockedTiles:boolean[][]):void
    {
        this._tilemap=[]; const rows=map.replace(/\n/g,'\r').split('\r').filter(r=>r.length); let width=Math.max(1,...rows.map(r=>r.length)); let height=rows.length;
        for(let y=0;y<MAX_NUM_TILE_PER_AXIS;y++){this._tilemap[y]=[];for(let x=0;x<MAX_NUM_TILE_PER_AXIS;x++){const char=(y<height&&x<width)?rows[y][x]:'x';this._tilemap[y][x]=new Tile(char&&char.toLowerCase()!=='x'?char.toLowerCase():'x',!!(blockedTiles[y]&&blockedTiles[y][x]));}}
        this._width=width;this._height=height;this._selection=null;this._anchor=null;
    }
    private getCurrentTilemapStringSafe(): string
    {
        // O componente pode renderizar antes de o mapa chegar do servidor.
        // Nunca acesse uma linha/tile sem conferir se ele já existe.
        if(!this._tilemap || !this._tilemap.length) return 'x';

        let maxX = 0;
        let maxY = 0;

        for(let y = 0; y < MAX_NUM_TILE_PER_AXIS; y++)
        {
            const tileRow = this._tilemap[y];

            if(!tileRow) continue;

            for(let x = 0; x < MAX_NUM_TILE_PER_AXIS; x++)
            {
                const tile = tileRow[x];

                if(tile && tile.height !== 'x')
                {
                    maxX = Math.max(maxX, x + 1);
                    maxY = Math.max(maxY, y + 1);
                }
            }
        }

        // Enquanto o mapa ainda não foi carregado, retorna um mapa vazio válido.
        if(maxX === 0 || maxY === 0) return 'x';

        const rows: string[] = [];

        for(let y = 0; y < maxY; y++)
        {
            const row: string[] = [];
            const tileRow = this._tilemap[y];

            for(let x = 0; x < maxX; x++)
            {
                const tile = tileRow && tileRow[x];
                row.push(tile && tile.height ? tile.height : 'x');
            }

            rows.push(row.join(''));
        }

        return rows.join('\r');
    }
    public getCurrentTilemapString():string { return this.getCurrentTilemapStringSafe(); }
    public getStats(){let tiles=0,holes=0,blocked=0;const heights:Record<string,number>={};for(let y=0;y<MAX_NUM_TILE_PER_AXIS;y++)for(let x=0;x<MAX_NUM_TILE_PER_AXIS;x++){const t=this._tilemap[y]&&this._tilemap[y][x];if(!t)continue;if(t.height==='x')holes++;else{tiles++;heights[t.height]=(heights[t.height]||0)+1;}if(t.isBlocked)blocked++;}return{tiles,holes,blocked,width:this._width,height:this._height,heights};}
    public clear():void { if(this._tilemapRenderer){this._tilemapRenderer.interactive=false;this._tilemapRenderer.clear();}this._tilemap=[];this._doorLocation.set(-1,-1);this._width=0;this._height=0;this._isHolding=false;this._lastUsedTile.set(-1,-1);this._actionSettings.clear();this._history=[];this._redoHistory=[];this._historyIndex=-1;this._selection=null; }
    public get tilemapRenderer():NitroTilemap{return this._tilemapRenderer;}
    public get tilemap():Tile[][]{return this._tilemap;}
    public get doorLocation():NitroPoint{return this._doorLocation;}
    public set doorLocation(value:NitroPoint){this._doorLocation=value;}
    public get actionSettings():ActionSettings{return this._actionSettings;}
    public get selection():Selection{return this._selection;}
    public get cursor():NitroPoint{return this._cursor;}
    public static get instance():FloorplanEditor{if(!this._INSTANCE)this._INSTANCE=new FloorplanEditor();return this._INSTANCE;}
}
