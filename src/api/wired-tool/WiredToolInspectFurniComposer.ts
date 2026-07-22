import { IMessageComposer } from '@nitrots/nitro-renderer';

export class WiredToolInspectFurniComposer implements IMessageComposer<ConstructorParameters<typeof WiredToolInspectFurniComposer>>
{
    public static readonly HEADER: number = 4028;

    private _itemId: number;

    constructor(itemId: number)
    {
        this._itemId = itemId;
    }

    public getMessageArray(): unknown[]
    {
        return [ this._itemId ];
    }

    public dispose(): void
    {
        this._itemId = 0;
    }
}
