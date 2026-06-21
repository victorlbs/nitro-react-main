import { FC, useEffect, useState } from 'react';
import {
  MdNorth,
  MdNorthEast,
  MdEast,
  MdSouthEast,
  MdSouth,
  MdSouthWest,
  MdWest,
  MdNorthWest
} from 'react-icons/md';

import { WiredFurniType } from '../../../../api';
import { Column, Text } from '../../../../common';
import { useWired } from '../../../../hooks';
import { WiredConditionBaseView } from './WiredConditionBaseView';

/**
 * React view for the multi-direction wired condition. This component displays
 * eight directional icons (north, northeast, east, southeast, south,
 * southwest, west and northwest) and allows the user to select any number
 * of them. When saved, the selected directions are sent to the emulator as
 * an array of integers. If no direction is selected, the condition will
 * never pass. The icons change colour when selected to provide visual
 * feedback.
 */
export const WiredConditionHabboDirectionMultiView: FC<{}> = () =>
{
    // Each direction corresponds to a numeric rotation value 0-7 in Habbo.
   const directions = [
  { id: 0, Icon: MdNorth,     label: 'Cima' },
  { id: 1, Icon: MdNorthEast, label: 'Cima‑direita' },
  { id: 2, Icon: MdEast,      label: 'Direita' },
  { id: 3, Icon: MdSouthEast, label: 'Baixo‑direita' },
  { id: 4, Icon: MdSouth,     label: 'Baixo' },
  { id: 5, Icon: MdSouthWest, label: 'Baixo‑esquerda' },
  { id: 6, Icon: MdWest,      label: 'Esquerda' },
  { id: 7, Icon: MdNorthWest, label: 'Cima‑esquerda' }
];

    const [ selected, setSelected ] = useState<number[]>([]);
    const { trigger = null, setIntParams = null } = useWired();

    // Pre-populate selected directions when editing an existing wired
    useEffect(() =>
    {
        if(trigger && Array.isArray(trigger.intData))
        {
            // Ensure values are numbers and unique
            const unique = Array.from(new Set(trigger.intData.map(value => parseInt(value))));
            setSelected(unique);
        }
    }, [ trigger ]);

    const toggleDirection = (id: number) =>
    {
        setSelected(prev => {
            if(prev.includes(id)) return prev.filter(d => d !== id);
            return [ ...prev, id ];
        });
    };

    const save = () =>
    {
        if(setIntParams) setIntParams(selected);
    };

    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_NONE } hasSpecialInput={ true } save={ save }>
            <Column gap={ 1 }>
                <Text bold>Escolha as direções permitidas</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    { directions.map(dir =>
                    {
                        const isActive = selected.includes(dir.id);
                        const IconComponent = dir.Icon;
                        return (
                            <label key={ dir.id } style={{ cursor: 'pointer', padding: '6px', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: isActive ? '#0d6efd20' : 'transparent' }} title={ dir.label }>
                                <input type="checkbox" style={{ display: 'none' }} checked={ isActive } onChange={ () => toggleDirection(dir.id) } />
                                <IconComponent size={ 20 } color={ isActive ? '#0d6efd' : '#000' } />
                            </label>
                        );
                    }) }
                </div>
            </Column>
        </WiredConditionBaseView>
    );
};
