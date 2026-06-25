import { IMessageDataWrapper, IMessageParser } from '@nitrots/nitro-renderer';

export class NameColorUpdateMessageParser implements IMessageParser
{
    private _username: string = '';
    private _color: string = '';

    public flush(): boolean
    {
        this._username = '';
        this._color = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._username = wrapper.readString();
        this._color = wrapper.readString();

        return true;
    }

    public get username(): string
    {
        return this._username;
    }

    public get color(): string
    {
        return this._color;
    }
}
