import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

/**
 * User interface for the "Habbo on Furni" wired condition. This selector allows the
 * room owner to define whether the condition should evaluate all users in the room
 * or only those passed from previous selectors, and whether the result should be
 * inverted. The selected furniture items serve as the targets; if any user stands
 * on one of the chosen items the condition returns true (unless inverted).
 */
export const WiredConditionHabboOnFurniView: FC<{}> = () =>
{
    // Whether to restrict evaluation to the RoomUnits passed in stuff[]
    const [ filterSelection, setFilterSelection ] = useState(false);
    // Whether to invert the logical result
    const [ invert, setInvert ] = useState(false);

    // Hook into the wired editor for reading and saving parameters
    const { trigger = null, setIntParams = null } = useWired();

    // Populate state when editing an existing wired
    useEffect(() =>
    {
        if (!trigger || !Array.isArray(trigger.intData)) return;
        const data = trigger.intData;
        if (data.length >= 2)
        {
            setFilterSelection(parseInt(data[0]) === 1);
            setInvert(parseInt(data[1]) === 1);
        }
    }, [ trigger ]);

    // Save the selected parameters to the emulator
    const save = () =>
    {
        if (setIntParams) setIntParams([ filterSelection ? 1 : 0, invert ? 1 : 0 ]);
    };

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID } hasSpecialInput={ true } save={ save }>
            <Column gap={ 2 }>
                {/* Filter selection checkbox */}
                <Flex alignItems="center" gap={ 1 }>
                    <input type="checkbox" className="form-check-input" id="filterSelectionHabboOnFurni" checked={ filterSelection } onChange={ e => setFilterSelection(e.target.checked) } />
                    <label htmlFor="filterSelectionHabboOnFurni">Filtrar seleção existente</label>
                </Flex>
                {/* Invert result checkbox */}
                <Flex alignItems="center" gap={ 1 }>
                    <input type="checkbox" className="form-check-input" id="invertHabboOnFurni" checked={ invert } onChange={ e => setInvert(e.target.checked) } />
                    <label htmlFor="invertHabboOnFurni">Inverter resultado</label>
                </Flex>
            </Column>
        </WiredConditionBaseView>
    );
};
