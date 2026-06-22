import { IMessageComposer } from '@nitrots/nitro-renderer';

/**
 * PlaceMoreItemMessageComposer
 *
 * Envia uma mensagem ao servidor para solicitar que itens idênticos no inventário
 * sejam colocados automaticamente. Implementa os métodos obrigatórios da interface
 * IMessageComposer: messageId, getMessageArray e dispose.
 */
export class PlaceMoreItemMessageComposer implements IMessageComposer<unknown[]>
{
    private _itemId: number;

    constructor(itemId: number)
    {
        this._itemId = itemId;
    }

    public get messageId(): number
    {
        return 1259; // ID do pacote RoomPlaceMoreItemEvent
    }

    public getMessageArray(): unknown[]
    {
        return [ this._itemId ];
    }

    public dispose(): void
    {
        // Não há recursos para limpar neste composer.
    }
}
