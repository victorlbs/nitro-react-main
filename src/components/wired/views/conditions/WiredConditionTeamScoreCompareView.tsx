import { FC, useEffect, useState } from 'react';
import ReactSlider from 'react-slider';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

/**
 * React view for the wired condition that compares a team's score with a chosen value.
 * Allows the user to select a team (red, green, blue, yellow), specify whether the
 * current score should be less than, equal to, or greater than the value, and
 * choose the number of points via a slider. The component persists its state to
 * the emulator using the setIntParams callback provided by the useWired hook.
 */
export const WiredConditionTeamScoreCompareView: FC<{}> = () =>
{
    // Teams: 1-4 map to RED, GREEN, BLUE, YELLOW in the emulator
    const teamIds: number[] = [ 1, 2, 3, 4 ];
    // Internal state
    const [ selectedTeam, setSelectedTeam ] = useState(1);
    const [ comparisonMode, setComparisonMode ] = useState(1); // 0=Menor,1=Igual,2=Maior
    const [ score, setScore ] = useState(1);

    const { trigger = null, setIntParams = null } = useWired();

    // Pre-fill values when editing existing wired
    useEffect(() =>
    {
        if(!trigger || !Array.isArray(trigger.intData)) return;
        const data = trigger.intData;
        if(data.length >= 3)
        {
            setSelectedTeam(parseInt(data[0]) || 1);
            setComparisonMode(parseInt(data[1]) || 1);
            setScore(parseInt(data[2]) || 0);
        }
    }, [ trigger ]);

    // Save callback sends the selected parameters to the emulator
    const save = () =>
    {
        if(setIntParams) setIntParams([ selectedTeam, comparisonMode, score ]);
    };

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <Column gap={ 2 }>
                {/* Team selection */}
                <Column gap={ 1 }>
                    <Text bold>{ LocalizeText('wiredfurni.params.team') }</Text>
                    { teamIds.map(value =>
                    {
                        return (
                            <Flex key={ value } gap={ 1 } alignItems="center">
                                <input className="form-check-input" type="radio" name="selectedTeam" id={ `selectedTeam${ value }` } checked={ (selectedTeam === value) } onChange={ () => setSelectedTeam(value) } />
                                <Text>{ LocalizeText(`wiredfurni.params.team.${ value }`) }</Text>
                            </Flex>
                        );
                    }) }
                </Column>

                {/* Comparison mode selection */}
                <Column gap={ 1 }>
                    <Text bold>Escolha o tipo</Text>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="compareLess" name="comparisonMode" checked={ comparisonMode === 0 } onChange={ () => setComparisonMode(0) } />
                        <label htmlFor="compareLess">Menor que</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="compareEqual" name="comparisonMode" checked={ comparisonMode === 1 } onChange={ () => setComparisonMode(1) } />
                        <label htmlFor="compareEqual">Igual</label>
                    </Flex>
                    <Flex alignItems="center" gap={ 1 }>
                        <input className="form-check-input" type="radio" id="compareGreater" name="comparisonMode" checked={ comparisonMode === 2 } onChange={ () => setComparisonMode(2) } />
                        <label htmlFor="compareGreater">Maior que</label>
                    </Flex>
                </Column>

                {/* Score selection */}
                <Column gap={ 1 }>
                    <Text bold>Equipe tem que marcar: { score }</Text>
                    <ReactSlider
                        className={ 'nitro-slider' }
                        min={ 0 }
                        max={ 1000 }
                        value={ score }
                        onChange={ event => setScore(event) } />
                </Column>
            </Column>
        </WiredConditionBaseView>
    );
};
