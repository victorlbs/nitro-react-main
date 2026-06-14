import { FC } from 'react';
import { LocalizeText } from '../../../api';
import { Column, Text } from '../../../common';
import { useWired } from '../../../hooks';
 // Importe o evento de seleção

export const WiredFurniSelectorView: FC<{}> = props =>
{
    const { trigger = null, furniIds = [] } = useWired();
    
    // Função que dispara o modo de seleção no Nitro
    const startSelection = () => {
        // Dispara o evento global que diz ao motor de jogo: "estamos selecionando mobis"
        //Nitro.instance.events.dispatchEvent(new WiredSelectFurniEvent(WiredSelectFurniEvent.START_SELECTION));
    };

    return (
        <Column gap={ 1 }>
            <Text bold>{ LocalizeText('wiredfurni.pickfurnis.caption', [ 'count', 'limit' ], [ furniIds.length.toString(), trigger.maximumItemSelectionCount.toString() ]) }</Text>
            <Text small>{ LocalizeText('wiredfurni.pickfurnis.desc') }</Text>
            
          
        </Column>
    );
}
