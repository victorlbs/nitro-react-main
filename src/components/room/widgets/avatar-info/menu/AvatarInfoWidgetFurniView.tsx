import { RoomControllerLevel, RoomObjectOperationType } from '@nitrots/nitro-renderer';
import { FC } from 'react';
import { FaArrowsAlt, FaSyncAlt, FaTrashRestore } from 'react-icons/fa';
import { attemptItemPlacement, AvatarInfoFurni, ProcessRoomObjectOperation } from '../../../../../api'; // Adicionamos o attemptItemPlacement aqui
import { Button, Flex } from '../../../../../common'; // Importamos o Button aqui
import { useInventoryFurni } from '../../../../../hooks';
import { ContextMenuHeaderView } from '../../context-menu/ContextMenuHeaderView';
import { ContextMenuListItemView } from '../../context-menu/ContextMenuListItemView';
import { ContextMenuView } from '../../context-menu/ContextMenuView';

interface AvatarInfoWidgetFurniViewProps {
    avatarInfo: AvatarInfoFurni;
    onClose: () => void;
}

export const AvatarInfoWidgetFurniView: FC<AvatarInfoWidgetFurniViewProps> = props => {
    const { avatarInfo = null, onClose = null } = props;

    const processAction = (name: string) => {
        let hideMenu = true;

        if (name) {
            switch (name) {
                case 'move':
                    ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_MOVE);
                    break;
                case 'rotate':
                    ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_ROTATE_POSITIVE);
                    break;
                case 'pickup':
                    ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_PICKUP);
                    break;
                case 'eject':
                    ProcessRoomObjectOperation(avatarInfo.id, avatarInfo.category, RoomObjectOperationType.OBJECT_EJECT);
                    break;
            }
        }
    }

    const { groupItems = [] } = useInventoryFurni();

    // Função que será chamada ao clicar em "Colocar mais"
    const processarColocarMais = () => {
        if (!avatarInfo) return;

        // Procura no inventário um mobi que tenha o mesmo typeId do mobi selecionado no quarto
        const itemNoInventario = groupItems.find(item => item.type === avatarInfo.typeId);

        if (itemNoInventario && itemNoInventario.getTotalCount() > 0) {
            // Usa a função nativa do Nitro para tentar colocar o item no quarto
            attemptItemPlacement(itemNoInventario); 
            // Opcional: Fecha o menu após clicar
            if (onClose) onClose();
        } else {
            console.log("Você não possui mais deste mobi no inventário.");
        }
    }

    return (
        <ContextMenuView objectId={ avatarInfo.id } category={ avatarInfo.category } onClose={ onClose } collapsable={ true }>
            <ContextMenuHeaderView>
                { avatarInfo.name }
            </ContextMenuHeaderView>

            { /* Nova fileira com Colocar Mais e Compre */ }
            <Flex gap={ 1 } className="margin-bottom-1">
                <Button 
                    variant="success" 
                    className="w-100" 
                    onClick={ processarColocarMais }
                >
                    <i className="icon icon-place-more" />
                    Colocar mais
                </Button>
                
                <Button 
                    variant="secondary" 
                    className="w-100"
                    // Futuramente podemos adicionar o onClick para abrir a página exata do catálogo aqui!
                >
                    <i className="icon icon-catalog" />
                    Compre
                </Button>
            </Flex>

            { /* Botão do Editor de Mobis */ }
            <Button variant="dark" className="w-100 margin-bottom-1">
                <i className="icon icon-floor-editor" />
                Editor de Mobis de Chão
            </Button>

            <Flex className="menu-list-split-3">
                <ContextMenuListItemView onClick={ event => processAction('move') }>
                    <FaArrowsAlt className="center fa-icon" />
                </ContextMenuListItemView>
                <ContextMenuListItemView onClick={ event => processAction('rotate') } disabled={ avatarInfo.isWallItem }>
                    <FaSyncAlt className="center fa-icon" />
                </ContextMenuListItemView>
                { (avatarInfo.isOwner || avatarInfo.isAnyRoomController) &&
                    <ContextMenuListItemView onClick={ event => processAction('pickup') }>
                        <FaTrashRestore className="center fa-icon" />
                    </ContextMenuListItemView> }
                { (!avatarInfo.isOwner && !avatarInfo.isAnyRoomController) && (avatarInfo.isRoomOwner || (avatarInfo.roomControllerLevel >= RoomControllerLevel.GUILD_ADMIN)) &&
                    <ContextMenuListItemView onClick={ event => processAction('eject') }>
                        <FaTrashRestore className="center fa-icon" />
                    </ContextMenuListItemView> }
            </Flex>
        </ContextMenuView>
    );
}
