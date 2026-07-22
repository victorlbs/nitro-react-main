import { IMessageDataWrapper, IMessageParser } from '@nitrots/nitro-renderer';

export interface WiredToolInspectionVariable
{
    variable: string;
    value: string;
}

export class WiredToolInspectionMessageParser implements IMessageParser
{
    private _holderType: number = 0;
    private _itemId: number = 0;
    private _classId: number = 0;
    private _itemName: string = '';
    private _variables: WiredToolInspectionVariable[] = [];

    public flush(): boolean
    {
        this._holderType = 0;
        this._itemId = 0;
        this._classId = 0;
        this._itemName = '';
        this._variables = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._holderType = wrapper.readInt();
        this._itemId = wrapper.readInt();
        this._classId = wrapper.readInt();
        this._itemName = wrapper.readString();

        const count = Math.max(0, Math.min(wrapper.readInt(), 200));

        this._variables = [];

        for(let i = 0; i < count; i++)
        {
            const variable = wrapper.readString();
            const value = wrapper.readString();

            this._variables.push({ variable, value });
        }

        return true;
    }

    public get holderType(): number
    {
        return this._holderType;
    }

    public get itemId(): number
    {
        return this._itemId;
    }

    public get classId(): number
    {
        return this._classId;
    }

    public get itemName(): string
    {
        return this._itemName;
    }

    public get variables(): WiredToolInspectionVariable[]
    {
        return this._variables;
    }
}
