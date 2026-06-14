import { FC, useEffect, useState } from 'react';
import { Column, Text } from '../../../../common';
import { WiredFurniSelectorView } from '../WiredFurniSelectorView';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';

export const WiredTriggerAtCounterTimeView: FC<IWiredTriggerBaseViewProps> = props => {
    const [timeInSeconds, setTimeInSeconds] = useState<number>(0);

    const save = () => {
        return [ timeInSeconds ];
    };

    useEffect(() => {
        setTimeInSeconds((props.trigger.intData && props.trigger.intData.length > 0) ? props.trigger.intData[0] : 0);
    }, [props.trigger]);

    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;

    const updateMinutes = (mins: number) => {
        setTimeInSeconds((mins * 60) + seconds);
    };

    const updateSeconds = (secs: number) => {
        setTimeInSeconds((minutes * 60) + secs);
    };

    return (
        <WiredTriggerBaseView { ...props } hasSpecialInput={ true } saveAction={ save }>
            <Column gap={ 1 }>
                <Text bold>Passaram { minutes } minutos</Text>
                <input 
                    type="range" 
                    className="form-range" 
                    min="0" 
                    max="59" 
                    value={ minutes } 
                    onChange={ e => updateMinutes(parseInt(e.target.value)) } 
                />
            </Column>
            <Column gap={ 1 }>
                <Text bold>passaram { seconds } segundos</Text>
                <input 
                    type="range" 
                    className="form-range" 
                    min="0" 
                    max="59" 
                    value={ seconds } 
                    onChange={ e => updateSeconds(parseInt(e.target.value)) } 
                />
            </Column>
            <WiredFurniSelectorView { ...props } />
        </WiredTriggerBaseView>
    );
};
