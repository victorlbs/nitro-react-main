import { FloorAction, HEIGHT_SCHEME } from './Constants';

export class ActionSettings
{
    private _currentAction = FloorAction.SET;
    private _currentHeight = HEIGHT_SCHEME[1];
    private _symmetry = false;

    public get currentAction(): number { return this._currentAction; }
    public set currentAction(value: number) { this._currentAction = value; }
    public get currentHeight(): string { return this._currentHeight; }
    public set currentHeight(value: string) { this._currentHeight = value; }
    public get symmetry(): boolean { return this._symmetry; }
    public set symmetry(value: boolean) { this._symmetry = value; }

    public clear(): void
    {
        this._currentAction = FloorAction.SET;
        this._currentHeight = HEIGHT_SCHEME[1];
        this._symmetry = false;
    }
}
