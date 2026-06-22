import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

/**
 * React view for the "Mobis na vizinhança" wired condition. This selector
 * evaluates whether any furniture item lies in a configured set of positions
 * relative to a point of reference (currently the user who triggered the wired
 * stack). The user may toggle which offsets around the origin are part of the
 * neighbourhood, filter the evaluation to only those items that activated the
 * wired stack, invert the logical result, and customise offsets via numeric
 * input. The selected configuration is persisted to the emulator via the
 * setIntParams callback provided by the useWired hook.
 *
 * IntParams layout expected by the emulator:
 * [ filterSelection (0/1), invert (0/1), originMode (0), offsetCount (N), dx1, dy1, dx2, dy2, ... ]
 */
export const WiredConditionFurniInNeighbourhoodView: FC<{}> = () =>
{
    const [ filterSelection, setFilterSelection ] = useState(false);
    const [ invert, setInvert ] = useState(false);
    // Currently only originMode 0 (triggering user) is implemented
    const [ originMode, setOriginMode ] = useState(0);
    // List of selected offsets (pairs of dx, dy)
    const [ offsets, setOffsets ] = useState<Array<{ dx: number; dy: number }>>([]);
    // Temporary inputs for adding custom offsets
    const [ inputX, setInputX ] = useState(0);
    const [ inputY, setInputY ] = useState(0);

    const { trigger = null, setIntParams = null } = useWired();

    // Prepopulate UI when editing an existing wired item
    useEffect(() =>
    {
        if(!trigger || !Array.isArray(trigger.intData)) return;
        const data: any = trigger.intData;
        if(data.length >= 4)
        {
            setFilterSelection(Boolean(data[0]));
            setInvert(Boolean(data[1]));
            setOriginMode(parseInt(data[2]) || 0);
            const n = parseInt(data[3]);
            const newOffsets: Array<{ dx: number; dy: number }> = [];
            let idx = 4;
            for(let i = 0; i < n; i++)
            {
                const dx = parseInt(data[idx++]);
                const dy = parseInt(data[idx++]);
                newOffsets.push({ dx, dy });
            }
            setOffsets(newOffsets);
        }
    }, [ trigger ]);

    // Toggle an offset in the selection when clicking on the grid
    const toggleOffset = (dx: number, dy: number) =>
    {
        const exists = offsets.some(off => off.dx === dx && off.dy === dy);
        if(exists)
        {
            setOffsets(offsets.filter(off => !(off.dx === dx && off.dy === dy)));
        }
        else
        {
            setOffsets([ ...offsets, { dx, dy } ]);
        }
    };

    // Add a custom offset via input fields
    const addOffset = () =>
    {
        const exists = offsets.some(off => off.dx === inputX && off.dy === inputY);
        if(!exists)
        {
            setOffsets([ ...offsets, { dx: inputX, dy: inputY } ]);
        }
    };

    // Save handler commits the selected parameters to the emulator
    const save = () =>
    {
        if(setIntParams)
        {
            const params: number[] = [];
            params.push(filterSelection ? 1 : 0);
            params.push(invert ? 1 : 0);
            params.push(originMode);
            params.push(offsets.length);
            offsets.forEach(off => {
                params.push(off.dx);
                params.push(off.dy);
            });
            setIntParams(params);
        }
    };

    // Range for grid (from -2 to 2) to give the user a visual selection area
    const gridRange = [ -2, -1, 0, 1, 2 ];

    return (
        <WiredConditionBaseView
            // This condition operates on furniture items; no additional selection is needed from the user
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            <Column gap={ 2 }>
                {/* Neighbourhood grid header */}
                <Column gap={ 1 }>
                    <Text bold>Selecionar pisos vizinhos</Text>
                    {/* Grid of offsets */}
                    { gridRange.map((row, rowIndex) => (
                        <Flex key={ rowIndex } gap={ 1 }>
                            { gridRange.map((col, colIndex) => {
                                // Coordinates relative to origin: x = col, y = row but invert y for display
                                const dx = col;
                                const dy = -row; // invert Y so that positive values appear below
                                const selected = offsets.some(off => off.dx === dx && off.dy === dy);
                                // The origin (0,0) is always disabled; we don't allow selecting it
                                const isOrigin = dx === 0 && dy === 0;
                                return (
                                    <div
                                        key={ colIndex }
                                        onClick={ () => { if(!isOrigin) toggleOffset(dx, dy); } }
                                        style={{
                                            width: 24,
                                            height: 24,
                                            border: '1px solid #888',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isOrigin ? '#b0c4de' : (selected ? '#4f9deb' : '#ffffff'),
                                            cursor: isOrigin ? 'default' : 'pointer'
                                        }}
                                        title={ isOrigin ? 'Origem' : `dx ${dx}, dy ${dy}` }
                                    >
                                        { isOrigin ? '' : '' }
                                    </div>
                                );
                            }) }
                        </Flex>
                    )) }
                </Column>

                {/* Manual offset input */}
                <Column gap={ 1 }>
                    <Text bold>Adicionar deslocamento</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <label className='text-black'>X:</label>
                        <input type="number" style={{ width: 50 }} value={ inputX } onChange={ e => setInputX(parseInt(e.target.value) || 0) } />
                        <label className='text-black' >Y:</label>
                        <input type="number" style={{ width: 50 }} value={ inputY } onChange={ e => setInputY(parseInt(e.target.value) || 0) } />
                        <button className="btn btn-primary btn-sm" onClick={ addOffset }>Adicionar</button>
                        <button className="btn btn-danger btn-sm" onClick={ () => setOffsets([]) }>Limpar</button>
                    </Flex>
                </Column>

                {/* Selector options */}
                <Column gap={ 1 }>
                    <Text bold>Opções do seletor</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="checkbox" id="neighbourFilterSelection" className="form-check-input" checked={ filterSelection } onChange={ e => setFilterSelection(e.target.checked) } />
                        <label className='text-black' htmlFor="neighbourFilterSelection">Filtrar seleção existente</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="checkbox" id="neighbourInvert" className="form-check-input" checked={ invert } onChange={ e => setInvert(e.target.checked) } />
                        <label className='text-black' htmlFor="neighbourInvert">Inverter</label>
                    </Flex>
                </Column>

                {/* Origin selection */}
                <Column gap={ 1 }>
                    <Text bold>Perto de:</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="radio" id="originUser" name="neighbourOrigin" className="form-check-input" checked={ originMode === 0 } onChange={ () => setOriginMode(0) } />
                        <label className='text-black' htmlFor="originUser">Use o usuário acionador</label>
                    </Flex>
                    {/* Future options could go here */}
                </Column>
            </Column>
        </WiredConditionBaseView>
    );
};
