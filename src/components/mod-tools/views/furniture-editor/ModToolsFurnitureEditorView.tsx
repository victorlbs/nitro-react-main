
import { FC, useMemo, useState } from 'react';
import { SendMessageComposer } from '../../../../api';
import './ModToolsFurnitureEditorView.scss';

interface FurnitureEditField
{
    key: string;
    label: string;
    type: 'number' | 'text' | 'boolean';
    placeholder: string;
}

const FIELDS: FurnitureEditField[] = [
    { key: 'altura', label: 'Altura', type: 'number', placeholder: 'Ex: 1' },
    { key: 'largura', label: 'Largura', type: 'number', placeholder: 'Ex: 1' },
    { key: 'tamanho', label: 'Tamanho', type: 'number', placeholder: 'Ex: 1' },

    { key: 'canstack', label: 'Pode empilhar', type: 'boolean', placeholder: '0 ou 1' },
    { key: 'cansit', label: 'Pode sentar', type: 'boolean', placeholder: '0 ou 1' },
    { key: 'canlay', label: 'Pode deitar', type: 'boolean', placeholder: '0 ou 1' },
    { key: 'canwalk', label: 'Pode andar', type: 'boolean', placeholder: '0 ou 1' },
    { key: 'cantrade', label: 'Pode trocar', type: 'boolean', placeholder: '0 ou 1' },
    { key: 'cangift', label: 'Pode presentear', type: 'boolean', placeholder: '0 ou 1' },
    { key: 'mercado', label: 'Marketplace', type: 'boolean', placeholder: '0 ou 1' },

    { key: 'interacao', label: 'Interação', type: 'text', placeholder: 'Ex: default' },
    { key: 'params', label: 'Custom params', type: 'text', placeholder: 'Ex: alguma-coisa' }
];

export const ModToolsFurnitureEditorView: FC<{}> = () =>
{
    const [ selectedField, setSelectedField ] = useState('altura');
    const [ value, setValue ] = useState('1');
    const [ lastCommand, setLastCommand ] = useState('');

    const currentField = useMemo(() =>
    {
        return FIELDS.find(field => field.key === selectedField) || FIELDS[0];
    }, [ selectedField ]);

    const sendEditCommand = () =>
    {
        const cleanValue = value.trim();

        if(!cleanValue.length) return;

        const command = `:editar ${ selectedField } ${ cleanValue }`;

        SendMessageComposer(new ChatMessageComposer(command, 0));

        setLastCommand(command);
    };

    return (
        <div className="mod-tools-furniture-editor">
            <div className="furni-editor-title">
                Editor de Mobis
            </div>

            <div className="furni-editor-description">
                Escolha o campo, defina o valor e clique em ativar. Depois dê 2 cliques no mobi dentro do quarto.
            </div>

            <div className="furni-editor-row">
                <label>Campo:</label>

                <select value={ selectedField } onChange={ event => setSelectedField(event.target.value) }>
                    { FIELDS.map(field =>
                        <option key={ field.key } value={ field.key }>
                            { field.label } ({ field.key })
                        </option>
                    ) }
                </select>
            </div>

            <div className="furni-editor-row">
                <label>Valor:</label>

                { currentField.type === 'boolean' ? (
                    <select value={ value } onChange={ event => setValue(event.target.value) }>
                        <option value="0">0 - Não</option>
                        <option value="1">1 - Sim</option>
                    </select>
                ) : (
                    <input
                        type={ currentField.type === 'number' ? 'number' : 'text' }
                        value={ value }
                        placeholder={ currentField.placeholder }
                        onChange={ event => setValue(event.target.value) }
                    />
                ) }
            </div>

            <button type="button" className="furni-editor-button" onClick={ sendEditCommand }>
                Ativar edição
            </button>

            { lastCommand &&
                <div className="furni-editor-last-command">
                    Comando enviado: <b>{ lastCommand }</b>
                </div>
            }

            <div className="furni-editor-warning">
                Atenção: isso edita a base do mobi. Pode afetar todos os mobis iguais no hotel.
            </div>
        </div>
    );
};
