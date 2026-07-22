export type IndividualClickMode = 'none' | 'original' | 'events';

export interface AdvancedClientSettings
{
    showFurniDetails: boolean;
    wiredAdvancedAlwaysOn: boolean;
    groupRepeatedMessages: boolean;
    zoomWithScroll: boolean;
    showFps: boolean;
    showPing: boolean;
    individualClickMode: IndividualClickMode;
}

const STORAGE_KEY = 'rio.client.advanced.settings';

export const ADVANCED_CLIENT_SETTINGS_DEFAULT: AdvancedClientSettings = {
    showFurniDetails: false,
    wiredAdvancedAlwaysOn: true,
    groupRepeatedMessages: true,
    zoomWithScroll: true,
    showFps: false,
    showPing: false,
    individualClickMode: 'none'
};

declare global
{
    interface Window
    {
        RioAdvancedClientSettings?: AdvancedClientSettings;
        RioSetPing?: (ping: number) => void;
    }
}

let fpsAnimationFrame = 0;
let fpsLastTime = performance.now();
let fpsFrames = 0;
let zoomBound = false;
let roomZoomScale = 1;

const validClickModes: IndividualClickMode[] = [ 'none', 'original', 'events' ];

const normalizeSettings = (settings: Partial<AdvancedClientSettings>): AdvancedClientSettings =>
{
    return {
        showFurniDetails: typeof settings.showFurniDetails === 'boolean' ? settings.showFurniDetails : ADVANCED_CLIENT_SETTINGS_DEFAULT.showFurniDetails,
        wiredAdvancedAlwaysOn: typeof settings.wiredAdvancedAlwaysOn === 'boolean' ? settings.wiredAdvancedAlwaysOn : ADVANCED_CLIENT_SETTINGS_DEFAULT.wiredAdvancedAlwaysOn,
        groupRepeatedMessages: typeof settings.groupRepeatedMessages === 'boolean' ? settings.groupRepeatedMessages : ADVANCED_CLIENT_SETTINGS_DEFAULT.groupRepeatedMessages,
        zoomWithScroll: typeof settings.zoomWithScroll === 'boolean' ? settings.zoomWithScroll : ADVANCED_CLIENT_SETTINGS_DEFAULT.zoomWithScroll,
        showFps: typeof settings.showFps === 'boolean' ? settings.showFps : ADVANCED_CLIENT_SETTINGS_DEFAULT.showFps,
        showPing: typeof settings.showPing === 'boolean' ? settings.showPing : ADVANCED_CLIENT_SETTINGS_DEFAULT.showPing,
        individualClickMode: validClickModes.includes(settings.individualClickMode as IndividualClickMode)
            ? settings.individualClickMode as IndividualClickMode
            : ADVANCED_CLIENT_SETTINGS_DEFAULT.individualClickMode
    };
};

export const LoadAdvancedClientSettings = (): AdvancedClientSettings =>
{
    try
    {
        const raw = localStorage.getItem(STORAGE_KEY);

        if(!raw) return ADVANCED_CLIENT_SETTINGS_DEFAULT;

        return normalizeSettings(JSON.parse(raw));
    }
    catch
    {
        return ADVANCED_CLIENT_SETTINGS_DEFAULT;
    }
};

export const SaveAdvancedClientSettings = (settings: AdvancedClientSettings): AdvancedClientSettings =>
{
    const normalized = normalizeSettings(settings);

    try
    {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    catch
    {
        // localStorage pode falhar em navegador privado.
    }

    ApplyAdvancedClientSettings(normalized);

    return normalized;
};

export const GetAdvancedClientSettings = (): AdvancedClientSettings =>
{
    return window.RioAdvancedClientSettings || LoadAdvancedClientSettings();
};

export const ApplyAdvancedClientSettings = (settings: AdvancedClientSettings = LoadAdvancedClientSettings()): void =>
{
    const normalized = normalizeSettings(settings);

    window.RioAdvancedClientSettings = normalized;

    document.documentElement.classList.toggle('rio-show-furni-details', normalized.showFurniDetails);
    document.documentElement.classList.toggle('rio-wired-advanced-always-on', normalized.wiredAdvancedAlwaysOn);
    document.documentElement.classList.toggle('rio-group-repeated-messages', normalized.groupRepeatedMessages);
    document.documentElement.classList.toggle('rio-zoom-with-scroll', normalized.zoomWithScroll);
    document.documentElement.classList.toggle('rio-show-fps', normalized.showFps);
    document.documentElement.classList.toggle('rio-show-ping', normalized.showPing);
    document.documentElement.setAttribute('data-rio-click-mode', normalized.individualClickMode);

    setupFpsOverlay(normalized.showFps);
    setupPingOverlay(normalized.showPing);
    setupZoomWithScroll();

    window.dispatchEvent(new CustomEvent('rio:advanced-settings-changed', {
        detail: normalized
    }));
};

const setupFpsOverlay = (enabled: boolean): void =>
{
    const overlay = document.getElementById('rio-fps-overlay');

    if(!enabled)
    {
        if(fpsAnimationFrame) cancelAnimationFrame(fpsAnimationFrame);

        fpsAnimationFrame = 0;

        if(overlay) overlay.remove();

        return;
    }

    let activeOverlay = overlay;

    if(!activeOverlay)
    {
        activeOverlay = document.createElement('div');
        activeOverlay.id = 'rio-fps-overlay';
        activeOverlay.className = 'rio-debug-overlay rio-fps-overlay';
        activeOverlay.innerText = 'FPS: --';
        document.body.appendChild(activeOverlay);
    }

    if(fpsAnimationFrame) return;

    fpsLastTime = performance.now();
    fpsFrames = 0;

    const tick = () =>
    {
        fpsFrames++;

        const now = performance.now();

        if(now >= fpsLastTime + 1000)
        {
            const fps = Math.round((fpsFrames * 1000) / (now - fpsLastTime));
            const currentOverlay = document.getElementById('rio-fps-overlay');

            if(currentOverlay) currentOverlay.innerText = `FPS: ${ fps }`;

            fpsFrames = 0;
            fpsLastTime = now;
        }

        fpsAnimationFrame = requestAnimationFrame(tick);
    };

    fpsAnimationFrame = requestAnimationFrame(tick);
};

const setupPingOverlay = (enabled: boolean): void =>
{
    let overlay = document.getElementById('rio-ping-overlay');

    if(!enabled)
    {
        if(overlay) overlay.remove();

        return;
    }

    if(!overlay)
    {
        overlay = document.createElement('div');
        overlay.id = 'rio-ping-overlay';
        overlay.className = 'rio-debug-overlay rio-ping-overlay';
        overlay.innerText = 'Ping: -- ms';
        document.body.appendChild(overlay);
    }

    window.RioSetPing = (ping: number) =>
    {
        const currentOverlay = document.getElementById('rio-ping-overlay');

        if(currentOverlay) currentOverlay.innerText = `Ping: ${ Math.max(0, Math.round(ping)) } ms`;
    };
};

const setupZoomWithScroll = (): void =>
{
    if(zoomBound) return;

    zoomBound = true;

    window.addEventListener('wheel', event =>
    {
        const settings = GetAdvancedClientSettings();

        if(!settings.zoomWithScroll) return;

        const target = event.target as HTMLElement;

        if(!target) return;

        const targetName = target.tagName.toLowerCase();
        const isRoomTarget = !!target.closest('.nitro-room') || targetName === 'canvas';

        if(!isRoomTarget) return;

        const roomCanvas = document.querySelector('.nitro-room-canvas canvas, #nitro-room-canvas canvas, .room-canvas canvas, canvas') as HTMLElement;

        if(!roomCanvas) return;

        if(event.deltaY < 0) roomZoomScale += 0.05;
        else roomZoomScale -= 0.05;

        roomZoomScale = Math.max(0.5, Math.min(2, roomZoomScale));

        roomCanvas.style.transformOrigin = 'center center';
        roomCanvas.style.transform = `scale(${ roomZoomScale })`;
    }, { passive: true });
};
