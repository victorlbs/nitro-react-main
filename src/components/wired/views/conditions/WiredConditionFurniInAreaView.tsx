import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

/**
 * React view for the custom "Furni in Area" wired condition. This UI allows the
 * user to configure a rectangular area on the room floor by specifying two corner
 * coordinates (x1,y1) and (x2,y2). An optional filter restricts the check to
 * only the furniture that triggered the wired stack, and another option inverts
 * the result so the condition passes when no relevant furniture is inside the area.
 */
export const WiredConditionFurniInAreaView: FC<{}> = () =>
{
    // State for whether to filter only triggering furni (true) or use all items (false)
    const [ filterSelection, setFilterSelection ] = useState(false);
    // State for inverting the result of the condition
    const [ invert, setInvert ] = useState(false);
    // Coordinates for the first and second corners of the rectangular area
    const [ x1, setX1 ] = useState(0);
    const [ y1, setY1 ] = useState(0);
    const [ x2, setX2 ] = useState(0);
    const [ y2, setY2 ] = useState(0);

    // Hook provided by the wired system to access existing trigger data and commit changes
    const { trigger = null, setIntParams = null } = useWired();

    // Initialise state from existing wired configuration when editing
    useEffect(() =>
    {
        if (!trigger) return;
        const data = trigger.intData;
        if (Array.isArray(data) && data.length >= 6)
        {
            setFilterSelection(data[0] === 1);
            setInvert(data[1] === 1);
            setX1(data[2]);
            setY1(data[3]);
            setX2(data[4]);
            setY2(data[5]);
        }
    }, [ trigger ]);

    // Commit current state to the emulator when the user saves
    const save = () =>
    {
        if (setIntParams)
        {
            setIntParams([
                filterSelection ? 1 : 0,
                invert ? 1 : 0,
                x1,
                y1,
                x2,
                y2
            ]);
        }
    };

    // Render a pair of numeric inputs for a coordinate label
    const renderCoordinateInputs = (label: string, valueX: number, setValueX: (value: number) => void, valueY: number, setValueY: (value: number) => void) =>
    {
        return (
            <Flex alignItems="center" gap={ 1 }>
                <Text>{ label }</Text>
                <input type="number" value={ valueX } min={ 0 } onChange={ e => setValueX(parseInt(e.target.value) || 0) } style={{ width: '60px' }} />
                <input type="number" value={ valueY } min={ 0 } onChange={ e => setValueY(parseInt(e.target.value) || 0) } style={{ width: '60px' }} />
            </Flex>
        );
    };

    return (
        <WiredConditionBaseView hasSpecialInput={ true } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } save={ save }>
            <Column gap={ 2 }>
                {/* Filter selection options */}
                <Column gap={ 1 }>
                    <Text bold>Filtrar seleção</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="radio" id="no-filter-selection" name="filter-selection" checked={ !filterSelection } onChange={ () => setFilterSelection(false) } />
                        <label htmlFor="no-filter-selection">Não filtrar seleção</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="radio" id="filter-selection" name="filter-selection" checked={ filterSelection } onChange={ () => setFilterSelection(true) } />
                        <label htmlFor="filter-selection">Filtrar seleção</label>
                    </Flex>
                </Column>

                {/* Invert option */}
                <Flex alignItems="center" gap={ 1 }>
                    <input type="checkbox" id="invert-area" checked={ invert } onChange={ e => setInvert(e.target.checked) } />
                    <label htmlFor="invert-area">Inverter área</label>
                </Flex>

                {/* Coordinate inputs */}
                <Column gap={ 1 }>
                    <Text bold>Área (coordenadas)</Text>
                    { renderCoordinateInputs('Canto superior esquerdo:', x1, setX1, y1, setY1) }
                    { renderCoordinateInputs('Canto inferior direito:', x2, setX2, y2, setY2) }
                </Column>
            </Column>
        </WiredConditionBaseView>
    );
};
