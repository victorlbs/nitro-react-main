import { FC } from 'react';
import { useMessageEvent } from '../../hooks';
import { NameColorUpdateMessageEvent } from './NameColorUpdateMessageEvent';
import { NameColorUpdateMessageParser } from './NameColorUpdateMessageParser';
import { SetNameColor } from './NameColorStore';

export const NameColorListenerView: FC<{}> = () =>
{
    useMessageEvent(NameColorUpdateMessageEvent, (event: NameColorUpdateMessageEvent) =>
    {
        const parser = event.getParser() as NameColorUpdateMessageParser;

        SetNameColor(parser.username, parser.color);
    });

    return null;
};
