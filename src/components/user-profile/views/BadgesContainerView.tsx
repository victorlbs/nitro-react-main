import { FC } from 'react';
import { LocalizeText } from '../../../api'; // Certifique-se de que o caminho do import está correto
import { Column, FlexProps, LayoutBadgeImageView } from '../../../common';

interface BadgesContainerViewProps extends FlexProps
{
    badges: string[];
}

const getBadgeRarityText = (badgeCode: string): string =>
{
    const rarityMap: Record<string, string> = {
        'DEV': 'Lendário',
        'ADM': 'Lendário',
        'VIP': 'Raro',
        'FAN20': 'Raro'
    };

    const rarity = rarityMap[badgeCode] || 'Comum';
    return `${rarity} emblema`; // Ajustado para ficar parecido com a foto ("Comum emblema")
}

export const BadgesContainerView: FC<BadgesContainerViewProps> = props =>
{
    const { badges = null, gap = 1, justifyContent = 'between', ...rest } = props;

    return (
        <>
            { badges && (badges.length > 0) && badges.map((badge, index) =>
            {
                const rarityText = getBadgeRarityText(badge);

                // No Nitro, as flash texts dos emblemas costumam ter esse prefixo:
                const badgeName = LocalizeText(`badge_name_${badge}`);
                const badgeDesc = LocalizeText(`badge_desc_${badge}`);

                return (
                    /* Adicionamos a classe customizada 'badge-wrapper' para controlar o hover */
                    <Column key={ badge } center className="badge-wrapper">
                        
                        <LayoutBadgeImageView badgeCode={ badge } />

                        {/* NOVO: Balão de Informações Customizado (Tooltip) */}
                        <div className="custom-badge-tooltip">
                            <span className="tooltip-title">{ badgeName }</span>
                            <span className="tooltip-desc">{ badgeDesc }</span>
                            
                            <div className="tooltip-rarity-pill">
                                { rarityText }
                            </div>
                        </div>

                    </Column>
                );
            }) }
        </>
    );
}
