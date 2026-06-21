import { FC, useEffect, useState } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Flex, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

/**
 * React view for the custom "Tempo Coincide" wired condition. This UI allows
 * the player to configure up to three time filters (hours, minutes and seconds),
 * each of which may be disabled, set to an exact value or restricted to a range.
 * The user can also select the time zone used when evaluating the condition.
 */
export const WiredConditionTimeCoincideView: FC<{}> = () =>
{
    // Local state for each filter: mode and values
    const [ hourMode, setHourMode ] = useState(0);
    const [ hourStart, setHourStart ] = useState(0);
    const [ hourEnd, setHourEnd ] = useState(23);
    const [ minuteMode, setMinuteMode ] = useState(0);
    const [ minuteStart, setMinuteStart ] = useState(0);
    const [ minuteEnd, setMinuteEnd ] = useState(59);
    const [ secondMode, setSecondMode ] = useState(0);
    const [ secondStart, setSecondStart ] = useState(0);
    const [ secondEnd, setSecondEnd ] = useState(59);
    const [ timeZone, setTimeZone ] = useState('UTC');

    // Hook provided by wired system to access existing trigger data and save parameters
    const { trigger = null, setIntParams = null, setStringParam = null } = useWired();

    // When the wired item is edited, initialise state from existing intData/stringData
    useEffect(() =>
    {
        if (!trigger) return;
        const data = trigger.intData;
        if (Array.isArray(data) && data.length >= 9)
        {
            setHourMode(data[0]);
            setHourStart(data[1]);
            setHourEnd(data[2]);
            setMinuteMode(data[3]);
            setMinuteStart(data[4]);
            setMinuteEnd(data[5]);
            setSecondMode(data[6]);
            setSecondStart(data[7]);
            setSecondEnd(data[8]);
        }
        if (typeof trigger.stringData === 'string' && trigger.stringData.length > 0)
        {
            setTimeZone(trigger.stringData);
        }
    }, [ trigger ]);

    // Commit changes to emulator when user clicks "Ready" (save)
    const save = () =>
    {
        if (setIntParams) setIntParams([
            hourMode, hourStart, hourEnd,
            minuteMode, minuteStart, minuteEnd,
            secondMode, secondStart, secondEnd
        ]);
        if (setStringParam) setStringParam(timeZone);
    };

    // Helper to render a group of controls for a specific unit (hours, minutes or seconds)
    const renderFilterGroup = (label: string, mode: number, setMode: (value: number) => void,
        start: number, setStart: (value: number) => void,
        end: number, setEnd: (value: number) => void,
        max: number) =>
    {
        return (
            <Column gap={ 1 }>
                <Text bold>{ label }</Text>
                {/* No filter */}
                <Flex alignItems="center" gap={ 1 }>
                    <input type="radio" id={ `${label}-mode-0` } name={ `${label}-mode` } checked={ mode === 0 } onChange={ () => setMode(0) } />
                    <label htmlFor={ `${label}-mode-0` }>Não filtrar</label>
                </Flex>
                {/* Exact value */}
                <Flex alignItems="center" gap={ 1 }>
                    <input type="radio" id={ `${label}-mode-1` } name={ `${label}-mode` } checked={ mode === 1 } onChange={ () => setMode(1) } />
                    <label htmlFor={ `${label}-mode-1` }>Exato</label>
                    { mode === 1 && (
                        <input type="number" min={ 0 } max={ max } value={ start } onChange={ e => setStart(Math.max(0, Math.min(max, parseInt(e.target.value) || 0))) } />
                    ) }
                </Flex>
                {/* Range */}
                <Flex alignItems="center" gap={ 1 }>
                    <input type="radio" id={ `${label}-mode-2` } name={ `${label}-mode` } checked={ mode === 2 } onChange={ () => setMode(2) } />
                    <label htmlFor={ `${label}-mode-2` }>Período</label>
                    { mode === 2 && (
                        <>
                            <input type="number" min={ 0 } max={ max } value={ start } onChange={ e => setStart(Math.max(0, Math.min(max, parseInt(e.target.value) || 0))) } />
                            <span>-</span>
                            <input type="number" min={ 0 } max={ max } value={ end } onChange={ e => setEnd(Math.max(0, Math.min(max, parseInt(e.target.value) || 0))) } />
                        </>
                    ) }
                </Flex>
            </Column>
        );
    };

    // List of common time zones for selection. Add more as needed.
    const timeZones = [
        'UTC',
        'America/Sao_Paulo',
        'Europe/Lisbon',
        'America/New_York',
        'Asia/Tokyo'
    ];

    return (
        <WiredConditionBaseView hasSpecialInput={ true } requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } save={ save }>
            <Column gap={ 2 }>
                { renderFilterGroup('Horas', hourMode, setHourMode, hourStart, setHourStart, hourEnd, setHourEnd, 23) }
                { renderFilterGroup('Minutos', minuteMode, setMinuteMode, minuteStart, setMinuteStart, minuteEnd, setMinuteEnd, 59) }
                { renderFilterGroup('Segundos', secondMode, setSecondMode, secondStart, setSecondStart, secondEnd, setSecondEnd, 59) }
                <Column gap={ 1 }>
                    <Text bold>Fuso horário</Text>
                    <select className="form-select" value={ timeZone } onChange={ e => setTimeZone(e.target.value) }>
                        { timeZones.map(tz => <option key={ tz } value={ tz }>{ tz }</option>) }
                    </select>
                </Column>
            </Column>
        </WiredConditionBaseView>
    );
};
