import { FC, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// --- DADOS SIMULADOS PARA TESTE ---
const MOCK_LEADERBOARD = [
    { rank: 1, name: 'Rita-RDCGP', figure: 'hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.sh-290-92', score: 7196 },
    { rank: 2, name: 'NetoMendes-BAN', figure: 'hr-893-45.hd-180-1.ch-210-66.lg-270-82.sh-118-68', score: 6853 },
    { rank: 3, name: 'Valioza', figure: 'hr-3163-1035.hd-600-1.ch-3215-92.lg-3216-82.sh-3115-92', score: 6669 },
    { rank: 4, name: 'fox.naruto', figure: 'hr-165-45.hd-180-2.ch-215-92.lg-275-92.sh-290-92', score: 6652 },
    { rank: 5, name: '-battlex-', figure: 'hr-828-45.hd-180-1.ch-210-92.lg-270-82.sh-118-68', score: 6312 },
    { rank: 6, name: 'Diafrix', figure: 'hr-893-45.hd-180-1.ch-210-66.lg-270-82.sh-118-68', score: 6263 },
    { rank: 7, name: 'ferrazmatheus', figure: 'hr-165-45.hd-180-2.ch-215-92.lg-275-92.sh-290-92', score: 5810 },
    { rank: 8, name: 'enecifran', figure: 'hr-828-45.hd-180-1.ch-210-92.lg-270-82.sh-118-68', score: 5804 },
    { rank: 9, name: 'Hyana_', figure: 'hr-3163-1035.hd-600-1.ch-3215-92.lg-3216-82.sh-3115-92', score: 5737 },
    { rank: 10, name: 'Weber', figure: 'hr-115-42.hd-195-19.ch-3030-82.lg-275-1408.sh-290-92', score: 5693 }
];

const CURRENT_USER_MOCK = { rank: '--', name: ':Vitrond', figure: 'hr-893-45.hd-180-1.ch-210-66.lg-270-82.sh-118-68', score: 405 };

interface LeaderboardWidgetViewProps {
    onClose: () => void;
}

export const LeaderboardWidgetView: FC<LeaderboardWidgetViewProps> = props => {
    const { onClose } = props;
    const [category, setCategory] = useState('Top Emblemas');

    // Função para renderizar a bolinha de posição (Ouro, Prata, Bronze, Azul)
    const getRankBadgeClass = (rank: number | string) => {
        if (rank === 1) return 'rank-gold';
        if (rank === 2) return 'rank-silver';
        if (rank === 3) return 'rank-bronze';
        return 'rank-normal';
    };

    return (
        <NitroCardView className="leaderboard-window" theme="primary-slim">
            <NitroCardHeaderView headerText={category} onCloseClick={onClose} />
            <NitroCardContentView className="leaderboard-content" gap={0}>
                
                {/* Cabeçalho da Lista (Estrela e Descrição) */}
                <div className="leaderboard-header-info">
                    <i className="icon icon-star-large" />
                    <div className="info-text">
                        <span className="info-title">Visão geral dos jogadores com o maior número de emblemas.</span>
                        <span className="info-desc">Esses usuários estão se dedicando bastante.</span>
                    </div>
                </div>

                {/* Lista de Jogadores */}
                <div className="leaderboard-list">
                    {MOCK_LEADERBOARD.map((user, index) => (
                        <div key={index} className="leaderboard-item">
                            <div className={`rank-circle ${getRankBadgeClass(user.rank)}`}>
                                {user.rank}
                            </div>
                            <div className="user-avatar">
                                <LayoutAvatarImageView figure={user.figure} direction={2} headOnly={true} />
                            </div>
                            <div className="user-name">{user.name}</div>
                            <div className="user-score">{user.score} <i className="icon icon-star-small" /></div>
                        </div>
                    ))}
                </div>

                {/* Usuário Atual (Destaque Azul Claro) */}
                <div className="leaderboard-item current-user-item">
                    <div className="rank-circle rank-normal">{CURRENT_USER_MOCK.rank}</div>
                    <div className="user-avatar">
                        <LayoutAvatarImageView figure={CURRENT_USER_MOCK.figure} direction={2} headOnly={true} />
                    </div>
                    <div className="user-name">{CURRENT_USER_MOCK.name}</div>
                    <div className="user-score">{CURRENT_USER_MOCK.score} <i className="icon icon-star-small" /></div>
                </div>

                {/* Botões de Paginação */}
                <div className="leaderboard-pagination">
                    <button className="btn-page disabled"><FaChevronLeft /> Anterior</button>
                    <button className="btn-page">Próximo <FaChevronRight /></button>
                </div>

            </NitroCardContentView>
        </NitroCardView>
    );
}
