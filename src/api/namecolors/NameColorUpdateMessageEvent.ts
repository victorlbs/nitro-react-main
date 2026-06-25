import { MessageEvent } from '@nitrots/nitro-renderer';
import { NameColorUpdateMessageParser } from './NameColorUpdateMessageParser';

export class NameColorUpdateMessageEvent extends MessageEvent
{
    public static readonly HEADER: number = 4016;

    constructor(callBack: Function)
    {
        super(callBack, NameColorUpdateMessageParser);
    }

    public getParser(): NameColorUpdateMessageParser
    {
        return super.getParser() as NameColorUpdateMessageParser;
    }
}
