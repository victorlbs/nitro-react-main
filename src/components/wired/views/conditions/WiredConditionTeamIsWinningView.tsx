import { FC, useEffect, useState } from 'react';
import { LocalizeText, WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

/**
 * React view for the wired condition that checks whether a team is currently
 * winning or occupying a particular ranking position in the active game. The
 * user can choose a team (activator, red, green, blue or yellow) and a
 * desired placement (1st–4th). When saved, these choices are sent to the
 * emulator as two integer parameters: the team index and the rank index.
 */
export const WiredConditionTeamIsWinningView: FC<{}> = () =>
{
    // 0: activator's team, 1: red, 2: green, 3: blue, 4: yellow
    const [ selectedTeam, setSelectedTeam ] = useState(0);
    // 1: first, 2: second, 3: third, 4: fourth
    const [ selectedPosition, setSelectedPosition ] = useState(1);

    const { trigger = null, setIntParams = null } = useWired();

    // Pre-fill values when editing an existing wired condition
    useEffect(() =>
    {
        if (!trigger || !Array.isArray(trigger.intData)) return;
        const data = trigger.intData;
        if (data.length >= 2)
        {
            const team = parseInt(data[0]);
            const pos = parseInt(data[1]);
            if (!isNaN(team)) setSelectedTeam(team);
            if (!isNaN(pos)) setSelectedPosition(pos);
        }
    }, [ trigger ]);

    // Save callback sends the configured parameters to the emulator
    const save = () =>
    {
        if (setIntParams) setIntParams([ selectedTeam, selectedPosition ]);
    };

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <Column gap={ 2 }>
                {/* Team selection */}
                <Column gap={ 1 }>
                    <Text bold>{ LocalizeText('wiredfurni.params.select_team') || 'Escolha um time' }</Text>
                    {/* Activator's team */}
                    <Flex gap={ 1 } alignItems="center">
                        <input className="form-check-input" type="radio" name="teamSelect" id="teamActivator" checked={ (selectedTeam === 0) } onChange={ () => setSelectedTeam(0) } />
                        <label htmlFor="teamActivator">{ LocalizeText('wiredfurni.params.team.activator') || 'Time do ativador' }</label>
                    </Flex>
                    {/* Red, green, blue, yellow teams */}
                    { [ 1, 2, 3, 4 ].map(value => (
                        <Flex key={ value } gap={ 1 } alignItems="center">
                            <input className="form-check-input" type="radio" name="teamSelect" id={ `team${ value }` } checked={ selectedTeam === value } onChange={ () => setSelectedTeam(value) } />
                            {/* Use existing localisation keys for team names; fallback to colours in Portuguese */}
                            <label htmlFor={ `team${ value }` }>
                                { LocalizeText(`wiredfurni.params.team.${ value }`) ||
                                    (value === 1 ? 'Vermelho' : value === 2 ? 'Verde' : value === 3 ? 'Azul' : 'Amarelo') }
                            </label>
                        </Flex>
                    )) }
                </Column>

                {/* Position selection */}
                <Column gap={ 1 }>
                    <Text bold>{ LocalizeText('wiredfurni.params.select_position') || 'Posicionamento' }</Text>
                    { [ 1, 2, 3, 4 ].map(pos => (
                        <Flex key={ pos } gap={ 1 } alignItems="center">
                            <input className="form-check-input" type="radio" name="positionSelect" id={ `position${ pos }` } checked={ selectedPosition === pos } onChange={ () => setSelectedPosition(pos) } />
                            <label htmlFor={ `position${ pos }` }>{ `${ pos }º lugar` }</label>
                        </Flex>
                    )) }
                </Column>
            </Column>
        </WiredConditionBaseView>
    );
};
