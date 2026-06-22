import { FC, useEffect, useState } from 'react';
import ReactSlider from 'react-slider';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

/**
 * React view for the "Mobi com Altitude" wired condition (selector). This
 * component allows the room owner to choose how to compare the height of
 * furniture items against a numeric threshold. It also provides options
 * to restrict the check to the furniture that activated the wired stack
 * (filterSelection) and to invert the result (invert). The selected
 * parameters are persisted to the emulator using the setIntParams
 * callback provided by the useWired hook.
 *
 * IntParams layout expected by the emulator:
 * [ filterSelection (0/1), invert (0/1), comparisonMode (0/1/2), height ]
 * where comparisonMode: 0 = less than, 1 = equal, 2 = greater than.
 */
export const WiredConditionFurniHeightCompareView: FC<{}> = () =>
{
    // State for filtering only the triggering selection
    const [ filterSelection, setFilterSelection ] = useState(false);
    // State for inverting the result
    const [ invert, setInvert ] = useState(false);
    // Comparison mode: 0 = less than, 1 = equal, 2 = greater than
    const [ comparisonMode, setComparisonMode ] = useState(1);
    // Height threshold (integer). We default to 0 because most rooms start at height 0.
    const [ height, setHeight ] = useState(0);

    const { trigger = null, setIntParams = null } = useWired();

    // When editing an existing wired item, prefill the UI with saved values
    useEffect(() =>
    {
        if(!trigger || !Array.isArray(trigger.intData)) return;
        const data = trigger.intData;
        if(data.length >= 4)
        {
            setFilterSelection(Boolean(data[0]));
            setInvert(Boolean(data[1]));
            // Ensure the comparison mode is within the expected range
            const mode = parseInt(data[2]);
            setComparisonMode((mode >= 0 && mode <= 2) ? mode : 1);
            setHeight(parseInt(data[3]) || 0);
        }
    }, [ trigger ]);

    // Save handler commits the selected parameters to the emulator
    const save = () =>
    {
        if(setIntParams)
        {
            setIntParams([
                filterSelection ? 1 : 0,
                invert ? 1 : 0,
                comparisonMode,
                height
            ]);
        }
    };

    return (
        <WiredConditionBaseView
            // This condition does not require selecting specific furniture items; it
            // operates on either all items in the room or the triggering selection.
            requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE }
            hasSpecialInput={ true }
            save={ save }>
            <Column gap={ 2 }>
                {/* Comparison mode selection */}
                <Column gap={ 1 }>
                    <Text bold>Escolha o tipo</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="radio" className="form-check-input" id="heightCompareLess" name="heightComparisonMode" checked={ comparisonMode === 0 } onChange={ () => setComparisonMode(0) } />
                        <label htmlFor="heightCompareLess">Menor que</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="radio" className="form-check-input" id="heightCompareEqual" name="heightComparisonMode" checked={ comparisonMode === 1 } onChange={ () => setComparisonMode(1) } />
                        <label htmlFor="heightCompareEqual">Igual</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="radio" className="form-check-input" id="heightCompareGreater" name="heightComparisonMode" checked={ comparisonMode === 2 } onChange={ () => setComparisonMode(2) } />
                        <label htmlFor="heightCompareGreater">Maior que</label>
                    </Flex>
                </Column>

                {/* Height selection slider */}
                <Column gap={ 1 }>
                    <Text bold>Selecionar altura: { height }</Text>
                    <ReactSlider
                        className={ 'nitro-slider' }
                        min={ 0 }
                        max={ 100 }
                        value={ height }
                        onChange={ event => setHeight(event) }
                    />
                </Column>

                {/* Selector options: filter existing selection and invert */}
                <Column gap={ 1 }>
                    <Text bold>Opções do seletor</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="checkbox" id="heightFilterSelection" className="form-check-input" checked={ filterSelection } onChange={ e => setFilterSelection(e.target.checked) } />
                        <label htmlFor="heightFilterSelection">Filtrar seleção existente</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input type="checkbox" id="heightInvert" className="form-check-input" checked={ invert } onChange={ e => setInvert(e.target.checked) } />
                        <label htmlFor="heightInvert">Inverter</label>
                    </Flex>
                </Column>
            </Column>
        </WiredConditionBaseView>
    );
};
