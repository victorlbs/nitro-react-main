import { FC } from 'react';
import { WiredFurniType } from '../../../../api';
import { Column, Text } from '../../../../common';
import { WiredConditionBaseView } from './WiredConditionBaseView';

/**
 * React view for the "Can perform movements" wired condition. This condition
 * allows the room owner to select furniture items and ensures that each
 * selected item has an unobstructed tile directly in front of it (based on
 * its rotation) so that a subsequent movement effect can succeed. It does
 * not expose any user‑configurable parameters besides the furniture
 * selection itself. The explanatory text is provided inline to help users
 * understand its purpose.
 */
export const WiredConditionCanPerformMovementsView: FC<{}> = props =>
{
    return (
        <WiredConditionBaseView requiresFurni={ WiredFurniType.STUFF_SELECTION_OPTION_BY_ID } hasSpecialInput={ true } save={ null }>
            <Column gap={ 1 }>
                <Text>
                    Verifica se os mobis selecionados podem se mover para o azulejo à sua frente
                    sem obstáculos. Use este seletor antes de um efeito de movimento para evitar
                    que a pilha falhe caso algum mobi não possa avançar.
                </Text>
            </Column>
        </WiredConditionBaseView>
    );
}
