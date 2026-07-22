import { MessageEvent } from '@nitrots/nitro-renderer';
import { WiredToolInspectionMessageParser } from './WiredToolInspectionMessageParser';

export class WiredToolInspectionMessageEvent extends MessageEvent
{
    public static readonly HEADER: number = 4029;

    constructor(callBack: Function)
    {
        super(callBack, WiredToolInspectionMessageParser);
    }

    public getParser(): WiredToolInspectionMessageParser
    {
        return super.getParser() as WiredToolInspectionMessageParser;
    }
}
