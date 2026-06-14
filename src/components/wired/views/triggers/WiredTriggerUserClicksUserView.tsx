import { FC } from 'react';
import { WiredTriggerBaseView } from './WiredTriggerBaseView';
import { WiredTriggerLayoutView } from './WiredTriggerLayoutView';

export const WiredTriggerUserClicksUserView: FC<WiredTriggerLayoutView> = props => {
    // Retorna a view base do Wired, informando que não há formulário extra
    return <WiredTriggerBaseView { ...props } hasSpecialInput={ false } />;
};
