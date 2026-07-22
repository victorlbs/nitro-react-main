import { FC, useEffect, useMemo, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

type TilePoint = {
    x: number;
    y: number;
};

const MAP_WIDTH = 20;
const MAP_HEIGHT = 20;
const TILE_WIDTH = 18;
const TILE_HEIGHT = 9;
const ORIGIN_X = 185;
const ORIGIN_Y = 12;

const normalizeArea = (x1: number, y1: number, x2: number, y2: number) =>
{
    return {
        minX: Math.min(x1, x2),
        minY: Math.min(y1, y2),
        maxX: Math.max(x1, x2),
        maxY: Math.max(y1, y2)
    };
};

const getTilePoints = (x: number, y: number): string =>
{
    const centerX = ((x - y) * (TILE_WIDTH / 2)) + ORIGIN_X;
    const centerY = ((x + y) * (TILE_HEIGHT / 2)) + ORIGIN_Y;

    return [
        `${ centerX },${ centerY }`,
        `${ centerX + (TILE_WIDTH / 2) },${ centerY + (TILE_HEIGHT / 2) }`,
        `${ centerX },${ centerY + TILE_HEIGHT }`,
        `${ centerX - (TILE_WIDTH / 2) },${ centerY + (TILE_HEIGHT / 2) }`
    ].join(' ');
};

export const WiredConditionFurniInAreaView: FC<{}> = () =>
{
    const [ filterSelection, setFilterSelection ] = useState(false);
    const [ invert, setInvert ] = useState(false);

    const [ x1, setX1 ] = useState(0);
    const [ y1, setY1 ] = useState(0);
    const [ x2, setX2 ] = useState(0);
    const [ y2, setY2 ] = useState(0);

    const [ isDragging, setIsDragging ] = useState(false);
    const [ hoverTile, setHoverTile ] = useState<TilePoint>({ x: 0, y: 0 });
    const [ selectionStart, setSelectionStart ] = useState<TilePoint>({ x: 0, y: 0 });

    const { trigger = null, setIntParams = null } = useWired();

    const selectedArea = useMemo(() =>
    {
        return normalizeArea(x1, y1, x2, y2);
    }, [ x1, y1, x2, y2 ]);

    const tiles = useMemo(() =>
    {
        const items: TilePoint[] = [];

        for(let y = 0; y < MAP_HEIGHT; y++)
        {
            for(let x = 0; x < MAP_WIDTH; x++)
            {
                items.push({ x, y });
            }
        }

        return items;
    }, []);

    useEffect(() =>
    {
        if(!trigger) return;

        const data = trigger.intData;

        if(Array.isArray(data) && data.length >= 6)
        {
            const savedFilter = Number(data[0]) === 1;
            const savedInvert = Number(data[1]) === 1;
            const savedX1 = Math.max(0, Number(data[2]) || 0);
            const savedY1 = Math.max(0, Number(data[3]) || 0);
            const savedX2 = Math.max(0, Number(data[4]) || 0);
            const savedY2 = Math.max(0, Number(data[5]) || 0);

            setFilterSelection(savedFilter);
            setInvert(savedInvert);
            setX1(savedX1);
            setY1(savedY1);
            setX2(savedX2);
            setY2(savedY2);
            setSelectionStart({ x: savedX1, y: savedY1 });
            setHoverTile({ x: savedX2, y: savedY2 });
        }
    }, [ trigger ]);

    useEffect(() =>
    {
        const stopDragging = () => setIsDragging(false);

        window.addEventListener('mouseup', stopDragging);
        window.addEventListener('touchend', stopDragging);

        return () =>
        {
            window.removeEventListener('mouseup', stopDragging);
            window.removeEventListener('touchend', stopDragging);
        };
    }, []);

    const save = () =>
    {
        if(!setIntParams) return;

        const area = normalizeArea(x1, y1, x2, y2);

        setIntParams([
            filterSelection ? 1 : 0,
            invert ? 1 : 0,
            area.minX,
            area.minY,
            area.maxX,
            area.maxY
        ]);
    };

    const selectTileStart = (tile: TilePoint) =>
    {
        setIsDragging(true);
        setSelectionStart(tile);
        setHoverTile(tile);

        setX1(tile.x);
        setY1(tile.y);
        setX2(tile.x);
        setY2(tile.y);
    };

    const updateTileSelection = (tile: TilePoint) =>
    {
        setHoverTile(tile);

        if(!isDragging) return;

        setX1(selectionStart.x);
        setY1(selectionStart.y);
        setX2(tile.x);
        setY2(tile.y);
    };

    const clearArea = () =>
    {
        setX1(0);
        setY1(0);
        setX2(0);
        setY2(0);
        setSelectionStart({ x: 0, y: 0 });
        setHoverTile({ x: 0, y: 0 });
    };

    const isTileSelected = (tile: TilePoint): boolean =>
    {
        return (
            tile.x >= selectedArea.minX &&
            tile.x <= selectedArea.maxX &&
            tile.y >= selectedArea.minY &&
            tile.y <= selectedArea.maxY
        );
    };

    const isTileCorner = (tile: TilePoint): boolean =>
    {
        return (
            (tile.x === x1 && tile.y === y1) ||
            (tile.x === x2 && tile.y === y2)
        );
    };

    return (
        <WiredConditionBaseView
            hasSpecialInput={ true }
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            save={ save }
        >
            <Column gap={ 2 } className="wired-area-selector-view">
                <div className="wired-area-selector-toolbar">
                    <button type="button" className="wired-area-tool-button add">
                        +
                    </button>

                    <button type="button" className="wired-area-tool-button clear" onClick={ clearArea }>
                        ×
                    </button>

                    <div className="wired-area-tool-separator" />

                    <button type="button" className="wired-area-tool-button target">
                        □
                    </button>
                </div>

                <div className="wired-area-floor-wrapper">
                    <svg
                        className="wired-area-floor"
                        viewBox="0 0 370 210"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        { tiles.map(tile =>
                        {
                            const selected = isTileSelected(tile);
                            const corner = isTileCorner(tile);

                            return (
                                <polygon
                                    key={ `${ tile.x }-${ tile.y }` }
                                    points={ getTilePoints(tile.x, tile.y) }
                                    className={
                                        `wired-area-tile ${ selected ? 'selected' : '' } ${ corner ? 'corner' : '' }`
                                    }
                                    onMouseDown={ event =>
                                    {
                                        event.preventDefault();
                                        selectTileStart(tile);
                                    } }
                                    onMouseEnter={ () => updateTileSelection(tile) }
                                    onMouseUp={ () => setIsDragging(false) }
                                />
                            );
                        }) }
                    </svg>

                    <div className="wired-area-coordinates">
                        <span>x:</span>
                        <input type="number" value={ hoverTile.x } readOnly />
                        <span>y:</span>
                        <input type="number" value={ hoverTile.y } readOnly />
                    </div>
                </div>

                <div className="wired-area-selected-info">
                    <Text bold>Área selecionada:</Text>
                    <span>
                        ({ selectedArea.minX }, { selectedArea.minY }) até ({ selectedArea.maxX }, { selectedArea.maxY })
                    </span>
                </div>

                <div className="wired-area-options">
                    <Text bold>Opções do seletor:</Text>

                    <Flex alignItems="center" gap={ 1 }>
                        <input
                            type="checkbox"
                            id="wired-area-filter-existing"
                            checked={ filterSelection }
                            onChange={ event => setFilterSelection(event.target.checked) }
                        />
                        <label htmlFor="wired-area-filter-existing">
                            Filtrar seleção existente
                        </label>
                    </Flex>

                    <Flex alignItems="center" gap={ 1 }>
                        <input
                            type="checkbox"
                            id="wired-area-invert"
                            checked={ invert }
                            onChange={ event => setInvert(event.target.checked) }
                        />
                        <label htmlFor="wired-area-invert">
                            Inverter
                        </label>
                    </Flex>
                </div>
            </Column>
        </WiredConditionBaseView>
    );
};
