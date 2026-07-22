import { FC, useMemo, useState } from 'react';
import { NitroCardContentView, NitroCardView } from '../common/card';
import './CommandListModal.scss';

export interface CommandItem
{
    name: string;
    desc: string;
    category?: string;
}

interface CommandListModalProps
{
    commands: CommandItem[];
    onClose?: () => void;
}

export const CommandListModal: FC<CommandListModalProps> = ({ commands = [], onClose = null }) =>
{
    const [ search, setSearch ] = useState('');
    const [ activeCategory, setActiveCategory ] = useState<string>('');

    const categories = useMemo(() =>
    {
        const uniqueCategories = Array.from(new Set(
            commands.map(command => command.category || 'Comandos')
        ));

        return uniqueCategories.length ? uniqueCategories : [ 'Comandos' ];
    }, [ commands ]);

    const currentCategory = activeCategory || categories[0];

    const filteredCommands = useMemo(() =>
    {
        const query = search.trim().toLowerCase();

        return commands.filter(command =>
        {
            const category = command.category || 'Comandos';

            if(category !== currentCategory) return false;

            if(!query.length) return true;

            return (
                command.name.toLowerCase().includes(query) ||
                command.desc.toLowerCase().includes(query)
            );
        });
    }, [ commands, currentCategory, search ]);

    return (
        <NitroCardView theme="primary" className="command-list-modal">
            <div className="command-list-top">
                <input
                    type="text"
                    value={ search }
                    onChange={ event => setSearch(event.target.value) }
                    placeholder="Busque por palavras chaves..."
                />

                <button
                    type="button"
                    className="command-list-close"
                    onClick={ () => onClose && onClose() }
                >
                    ×
                </button>
            </div>

            <div className="command-list-tabs">
                { categories.map(category =>
                    <button
                        key={ category }
                        type="button"
                        className={ currentCategory === category ? 'active' : '' }
                        onClick={ () =>
                        {
                            setActiveCategory(category);
                            setSearch('');
                        } }
                    >
                        { category }
                    </button>
                ) }
            </div>

            <NitroCardContentView className="command-list-content">
                { filteredCommands.length === 0 &&
                    <div className="command-list-empty">
                        Nenhum comando encontrado.
                    </div>
                }

                { filteredCommands.map((cmd, index) =>
                    <div key={ `${ cmd.name }-${ index }` } className="command-list-item">
                        <div className="command-list-name">
                            { cmd.name }
                        </div>

                        <div className="command-list-desc">
                            { cmd.desc }
                        </div>
                    </div>
                ) }
            </NitroCardContentView>
        </NitroCardView>
    );
};
