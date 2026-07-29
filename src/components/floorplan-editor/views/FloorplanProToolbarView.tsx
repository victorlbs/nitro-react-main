import { FC, useMemo, useState } from 'react';
import {
    FaArrowsAltH, FaArrowsAltV, FaChevronDown, FaCopy, FaCut, FaEraser,
    FaEye, FaFillDrip, FaGripHorizontal, FaHistory, FaLayerGroup,
    FaMousePointer, FaPaintBrush, FaPaste, FaRedo, FaRoute, FaSave,
    FaShapes, FaSlidersH, FaSyncAlt, FaTrash, FaUndo
} from 'react-icons/fa';
import { FloorAction, HEIGHT_SCHEME } from '../common/Constants';
import { FloorplanEditor } from '../common/FloorplanEditor';

interface Props {
    zoom: number;
    setZoom(value: number): void;
    showGrid: boolean;
    setShowGrid(value: boolean): void;
    showHeights: boolean;
    setShowHeights(value: boolean): void;
    nightMode: boolean;
    setNightMode(value: boolean): void;
    onPreview(): void;
    onSaveAs(): void;
    onImportExport(): void;
}

interface ToolDefinition {
    action: number;
    name: string;
    shortcut: string;
    icon: JSX.Element;
}

const TOOLS: ToolDefinition[] = [
    { action: FloorAction.SET, name: 'Pincel', shortcut: 'B', icon: <FaPaintBrush /> },
    { action: FloorAction.UNSET, name: 'Borracha', shortcut: 'E', icon: <FaEraser /> },
    { action: FloorAction.FILL, name: 'Preencher', shortcut: 'G', icon: <FaFillDrip /> },
    { action: FloorAction.LINE, name: 'Linha', shortcut: 'L', icon: <FaRoute /> },
    { action: FloorAction.RECTANGLE, name: 'Retângulo', shortcut: 'R', icon: <FaShapes /> },
    { action: FloorAction.SELECT, name: 'Selecionar', shortcut: 'S', icon: <FaMousePointer /> }
];

export const FloorplanProToolbarView: FC<Props> = props =>
{
    const {
        zoom, setZoom, showGrid, setShowGrid, showHeights, setShowHeights,
        nightMode, setNightMode, onPreview, onSaveAs, onImportExport
    } = props;

    const editor = FloorplanEditor.instance;
    const [ action, setAction ] = useState(editor.actionSettings.currentAction);
    const [ height, setHeight ] = useState(0);
    const [ symmetry, setSymmetry ] = useState(editor.actionSettings.symmetry);
    const [ moreOpen, setMoreOpen ] = useState(false);
    const [ template, setTemplate ] = useState('20x20');

    const selectedTool = useMemo(() => TOOLS.find(tool => tool.action === action) ?? TOOLS[0], [ action ]);

    const choose = (value: number) =>
    {
        setAction(value);
        editor.actionSettings.currentAction = value;
    };

    const changeHeight = (value: number) =>
    {
        const safe = Math.max(0, Math.min(26, Number.isFinite(value) ? value : 0));
        setHeight(safe);
        editor.actionSettings.currentHeight = HEIGHT_SCHEME[safe + 1];
    };

    const toggleSymmetry = () =>
    {
        const value = !symmetry;
        setSymmetry(value);
        editor.actionSettings.symmetry = value;
    };

    return <div className="fp-builder-ribbon">
        <div className="fp-builder-row">
            <div className="fp-ribbon-group fp-tool-group" aria-label="Ferramentas de construção">
                { TOOLS.map(tool => <button
                    key={ tool.action }
                    type="button"
                    className={ `fp-ribbon-btn ${ action === tool.action ? 'active' : '' }` }
                    onClick={ () => choose(tool.action) }
                    title={ `${ tool.name } (${ tool.shortcut })` }>
                    { tool.icon }
                    <span>{ tool.name }</span>
                    <kbd>{ tool.shortcut }</kbd>
                </button>) }
            </div>

            <div className="fp-ribbon-divider" />

            <div className="fp-ribbon-group fp-height-quick" title="Altura atual do piso">
                <button className="fp-square-btn" onClick={ () => changeHeight(height - 1) } aria-label="Diminuir altura">−</button>
                <button className="fp-height-display" title="Clique para voltar à altura 0" onClick={ () => changeHeight(0) }>
                    <small>ALTURA</small><strong>{ height }</strong>
                </button>
                <button className="fp-square-btn" onClick={ () => changeHeight(height + 1) } aria-label="Aumentar altura">+</button>
                <select value={ height } onChange={ event => changeHeight(parseInt(event.target.value)) } title="Selecionar altura">
                    { Array.from({ length: 27 }, (_, value) => <option key={ value } value={ value }>{ value }</option>) }
                </select>
            </div>

            <div className="fp-ribbon-divider" />

            <div className="fp-ribbon-group fp-history-actions">
                <button className="fp-icon-btn" title="Desfazer (Ctrl+Z)" onClick={ () => editor.undo() }><FaUndo /></button>
                <button className="fp-icon-btn" title="Refazer (Ctrl+Y)" onClick={ () => editor.redo() }><FaRedo /></button>
                <button className="fp-icon-btn" title="Copiar seleção (Ctrl+C)" onClick={ () => editor.copySelection() }><FaCopy /></button>
                <button className="fp-icon-btn" title="Colar seleção (Ctrl+V)" onClick={ () => editor.pasteSelection() }><FaPaste /></button>
            </div>

            <div className="fp-ribbon-spacer" />

            <div className="fp-ribbon-group fp-view-quick">
                <button className={ `fp-icon-btn ${ showGrid ? 'active' : '' }` } title="Mostrar grade" onClick={ () => setShowGrid(!showGrid) }><FaGripHorizontal /></button>
                <button className={ `fp-icon-btn ${ showHeights ? 'active' : '' }` } title="Mostrar alturas" onClick={ () => setShowHeights(!showHeights) }><FaLayerGroup /></button>
                <button className={ `fp-icon-btn ${ symmetry ? 'active' : '' }` } title="Desenho simétrico" onClick={ toggleSymmetry }><FaArrowsAltH /></button>
                <select className="fp-zoom-select" value={ zoom } onChange={ event => setZoom(parseInt(event.target.value)) } title="Zoom do mapa">
                    { [25, 50, 75, 100, 125, 150, 200, 400].map(value => <option key={ value } value={ value }>{ value }%</option>) }
                </select>
                <button className="fp-preview-btn" onClick={ onPreview } title="Conferir mapa antes de salvar"><FaEye /><span>Conferir</span></button>
                <button className="fp-more-btn" onClick={ () => setMoreOpen(value => !value) } aria-expanded={ moreOpen }><FaSlidersH /><span>Mais</span><FaChevronDown /></button>
            </div>
        </div>

        <div className="fp-tool-hint">
            <b>{ selectedTool.name }</b>
            <span>{ selectedTool.shortcut } para selecionar</span>
            <i />
            <span>Alt + roda: altura</span>
            <i />
            <span>Ctrl + roda: zoom</span>
        </div>

        { moreOpen && <div className="fp-builder-drawer">
            <div className="fp-drawer-section">
                <b>Seleção rápida</b>
                <div className="fp-drawer-actions">
                    <button onClick={ () => editor.cutSelection() }><FaCut /> Recortar</button>
                    <button onClick={ () => editor.deleteSelection() }><FaTrash /> Apagar</button>
                    <button onClick={ () => editor.mirrorSelection(true) }><FaArrowsAltH /> Espelhar H</button>
                    <button onClick={ () => editor.mirrorSelection(false) }><FaArrowsAltV /> Espelhar V</button>
                    <button onClick={ () => editor.rotateSelection() }><FaSyncAlt /> Girar 90°</button>
                </div>
            </div>

            <div className="fp-drawer-section fp-template-section">
                <b>Começar rápido</b>
                <select value={ template } onChange={ event => setTemplate(event.target.value) }>
                    <option value="20x20">Sala 20 × 20</option>
                    <option value="30x30">Sala 30 × 30</option>
                    <option value="cassino">Base de cassino</option>
                    <option value="loja">Base de loja</option>
                    <option value="labirinto">Base de labirinto</option>
                </select>
                <button onClick={ () => window.confirm('Substituir o mapa atual por este modelo?') && editor.applyTemplate(template) }>Aplicar modelo</button>
            </div>

            <div className="fp-drawer-section">
                <b>Arquivo e visual</b>
                <div className="fp-drawer-actions">
                    <button onClick={ onSaveAs }><FaSave /> Salvar cópia</button>
                    <button onClick={ onImportExport }><FaHistory /> Importar / Exportar</button>
                    <button className={ nightMode ? 'active' : '' } onClick={ () => setNightMode(!nightMode) }>Modo noturno</button>
                </div>
            </div>
        </div> }
    </div>;
};
