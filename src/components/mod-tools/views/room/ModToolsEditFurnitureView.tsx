import { FC, useState } from 'react';
import { SendMessageComposer } from '../../../../api';
import { Button, Column, Flex, Text } from '../../../../common';

export const ModToolsEditFurnitureView: FC<{}> = props => {
    const [ selectedType, setSelectedType ] = useState<string>('largura');
    const [ value, setValue ] = useState<string>('');

    const sendEditCommand = () => {
        if (!value.trim()) return;
        
        // Dispara o comando no chat do quarto automaticamente
        SendMessageComposer(new RoomChatComposer(`:editar ${ selectedType } ${ value }`));
        
        // Limpa o input após o envio para facilitar a próxima edição
        setValue('');
    };

    // Propriedades exatas do seu plugin Java
    const fields = [
        "largura", "tamanho", "altura", "canstack", "canlay", 
        "cansit", "canwalk", "cantrade", "cangift", "mercado", 
        "interacao", "params"
    ];

    return (
        <Column gap={ 1 } className="p-2 border rounded mt-2">
            <Text bold>Editor de Mobília Rápido</Text>
            <Text fontSize={ 6 }>Selecione a propriedade e informe o valor. Após aplicar, clique duas vezes no mobi.</Text>
            
            <Flex gap={ 1 } alignItems="center" className="mt-1">
                <Text className="w-25" fontSize={ 6 }>Propriedade:</Text>
                <select 
                    className="form-select form-select-sm w-75" 
                    value={ selectedType } 
                    onChange={ event => setSelectedType(event.target.value) }>
                    { fields.map(field => <option key={ field } value={ field }>{ field }</option>) }
                </select>
            </Flex>

            <Flex gap={ 1 } alignItems="center">
                <Text className="w-25" fontSize={ 6 }>Novo Valor:</Text>
                <input 
                    type="text" 
                    className="form-control form-control-sm w-75" 
                    value={ value } 
                    onChange={ event => setValue(event.target.value) } 
                    placeholder="Ex: 1, 0, default..." 
                />
            </Flex>

            <Button variant="success" className="mt-1" onClick={ sendEditCommand } disabled={ !value.trim() }>
                Aplicar Comando
            </Button>
        </Column>
    );
};
