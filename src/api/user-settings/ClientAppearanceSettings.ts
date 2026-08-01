export type ClientTheme = 'nitro' | 'habbo-classic' | 'light' | 'dark' | 'neon' | 'minimal';
export type ClientDensity = 'compact' | 'normal' | 'large';
export type ClientWindowShape = 'square' | 'soft' | 'rounded';

export interface ClientAppearanceSettings
{
    theme: ClientTheme;
    accentColor: string;
    density: ClientDensity;
    windowShape: ClientWindowShape;
    transparency: number;
    animations: boolean;
    highContrast: boolean;
}

const STORAGE_KEY = 'rio.client.appearance.settings';

export const CLIENT_APPEARANCE_DEFAULT: ClientAppearanceSettings = {
    theme: 'nitro',
    accentColor: '#2a7798',
    density: 'normal',
    windowShape: 'soft',
    transparency: 0,
    animations: true,
    highContrast: false
};

const themes: ClientTheme[] = [ 'nitro', 'habbo-classic', 'light', 'dark', 'neon', 'minimal' ];
const densities: ClientDensity[] = [ 'compact', 'normal', 'large' ];
const shapes: ClientWindowShape[] = [ 'square', 'soft', 'rounded' ];

const normalizeColor = (value: unknown): string =>
{
    if(typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) return CLIENT_APPEARANCE_DEFAULT.accentColor;

    return value.toLowerCase();
};

const normalizeSettings = (settings: Partial<ClientAppearanceSettings> = {}): ClientAppearanceSettings => ({
    theme: themes.includes(settings.theme as ClientTheme) ? settings.theme as ClientTheme : CLIENT_APPEARANCE_DEFAULT.theme,
    accentColor: normalizeColor(settings.accentColor),
    density: densities.includes(settings.density as ClientDensity) ? settings.density as ClientDensity : CLIENT_APPEARANCE_DEFAULT.density,
    windowShape: shapes.includes(settings.windowShape as ClientWindowShape) ? settings.windowShape as ClientWindowShape : CLIENT_APPEARANCE_DEFAULT.windowShape,
    transparency: Math.max(0, Math.min(35, Number(settings.transparency) || 0)),
    animations: typeof settings.animations === 'boolean' ? settings.animations : CLIENT_APPEARANCE_DEFAULT.animations,
    highContrast: typeof settings.highContrast === 'boolean' ? settings.highContrast : CLIENT_APPEARANCE_DEFAULT.highContrast
});

export const LoadClientAppearanceSettings = (): ClientAppearanceSettings =>
{
    try
    {
        const raw = localStorage.getItem(STORAGE_KEY);

        return raw ? normalizeSettings(JSON.parse(raw)) : CLIENT_APPEARANCE_DEFAULT;
    }
    catch
    {
        return CLIENT_APPEARANCE_DEFAULT;
    }
};

export const ApplyClientAppearanceSettings = (settings: ClientAppearanceSettings = LoadClientAppearanceSettings()): ClientAppearanceSettings =>
{
    const normalized = normalizeSettings(settings);
    const root = document.documentElement;

    root.setAttribute('data-client-theme', normalized.theme);
    root.setAttribute('data-client-density', normalized.density);
    root.setAttribute('data-client-window-shape', normalized.windowShape);
    root.classList.toggle('client-animations-disabled', !normalized.animations);
    root.classList.toggle('client-high-contrast', normalized.highContrast);
    root.style.setProperty('--client-accent-custom', normalized.accentColor);
    root.style.setProperty('--client-window-opacity', String(1 - (normalized.transparency / 100)));

    window.dispatchEvent(new CustomEvent('rio:appearance-settings-changed', { detail: normalized }));

    return normalized;
};

export const SaveClientAppearanceSettings = (settings: ClientAppearanceSettings): ClientAppearanceSettings =>
{
    const normalized = normalizeSettings(settings);

    try
    {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    catch
    {
        // O armazenamento pode estar indisponível no modo privado.
    }

    return ApplyClientAppearanceSettings(normalized);
};

export const ResetClientAppearanceSettings = (): ClientAppearanceSettings => SaveClientAppearanceSettings(CLIENT_APPEARANCE_DEFAULT);
