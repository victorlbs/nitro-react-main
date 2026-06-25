import { NitroConfiguration } from '@nitrots/nitro-renderer';

export type VideoFpsMax = 0 | 30 | 60 | 120 | 144;
export type VideoScaleQuality = 'quality' | 'balanced' | 'performance';
export type VideoGpuPrecision = 'high' | 'medium';
export type VideoPerformanceMode = 'balanced' | 'performance' | 'quality';
export type VideoDataFlow = 'instant' | 'balanced' | 'economy';
export type VideoGraphicStability = 'high_fidelity' | 'stable' | 'fast';

export interface VideoSettings
{
    fpsMax: VideoFpsMax;
    scaleQuality: VideoScaleQuality;
    gpuPrecision: VideoGpuPrecision;
    performanceMode: VideoPerformanceMode;
    dataFlow: VideoDataFlow;
    graphicStability: VideoGraphicStability;
    antialias: boolean;
}

const STORAGE_KEY = 'rio.video.settings';

export const VIDEO_SETTINGS_DEFAULT: VideoSettings = {
    fpsMax: 0,
    scaleQuality: 'quality',
    gpuPrecision: 'high',
    performanceMode: 'balanced',
    dataFlow: 'instant',
    graphicStability: 'high_fidelity',
    antialias: true
};

const allowedFps: VideoFpsMax[] = [ 0, 30, 60, 120, 144 ];
const allowedScaleQuality: VideoScaleQuality[] = [ 'quality', 'balanced', 'performance' ];
const allowedGpuPrecision: VideoGpuPrecision[] = [ 'high', 'medium' ];
const allowedPerformanceMode: VideoPerformanceMode[] = [ 'balanced', 'performance', 'quality' ];
const allowedDataFlow: VideoDataFlow[] = [ 'instant', 'balanced', 'economy' ];
const allowedGraphicStability: VideoGraphicStability[] = [ 'high_fidelity', 'stable', 'fast' ];

const normalize = (settings: Partial<VideoSettings>): VideoSettings =>
{
    return {
        fpsMax: allowedFps.includes(settings.fpsMax as VideoFpsMax) ? settings.fpsMax as VideoFpsMax : VIDEO_SETTINGS_DEFAULT.fpsMax,
        scaleQuality: allowedScaleQuality.includes(settings.scaleQuality as VideoScaleQuality) ? settings.scaleQuality as VideoScaleQuality : VIDEO_SETTINGS_DEFAULT.scaleQuality,
        gpuPrecision: allowedGpuPrecision.includes(settings.gpuPrecision as VideoGpuPrecision) ? settings.gpuPrecision as VideoGpuPrecision : VIDEO_SETTINGS_DEFAULT.gpuPrecision,
        performanceMode: allowedPerformanceMode.includes(settings.performanceMode as VideoPerformanceMode) ? settings.performanceMode as VideoPerformanceMode : VIDEO_SETTINGS_DEFAULT.performanceMode,
        dataFlow: allowedDataFlow.includes(settings.dataFlow as VideoDataFlow) ? settings.dataFlow as VideoDataFlow : VIDEO_SETTINGS_DEFAULT.dataFlow,
        graphicStability: allowedGraphicStability.includes(settings.graphicStability as VideoGraphicStability) ? settings.graphicStability as VideoGraphicStability : VIDEO_SETTINGS_DEFAULT.graphicStability,
        antialias: typeof settings.antialias === 'boolean' ? settings.antialias : VIDEO_SETTINGS_DEFAULT.antialias
    };
};

const setNitroConfigValue = (key: string, value: unknown): void =>
{
    try
    {
        const nitroConfiguration = NitroConfiguration as unknown as {
            setValue?: (key: string, value: unknown) => void;
            set?: (key: string, value: unknown) => void;
        };

        if(typeof nitroConfiguration.setValue === 'function')
        {
            nitroConfiguration.setValue(key, value);
        }
        else if(typeof nitroConfiguration.set === 'function')
        {
            nitroConfiguration.set(key, value);
        }

        const globalWindow = window as unknown as {
            NitroConfig?: Record<string, unknown>;
        };

        if(globalWindow.NitroConfig)
        {
            globalWindow.NitroConfig[key] = value;
        }
    }
    catch
    {
        // Segurança: não quebra o client se o renderer não aceitar update em runtime.
    }
};

export const LoadVideoSettings = (): VideoSettings =>
{
    try
    {
        const raw = localStorage.getItem(STORAGE_KEY);

        if(!raw) return VIDEO_SETTINGS_DEFAULT;

        return normalize(JSON.parse(raw));
    }
    catch
    {
        return VIDEO_SETTINGS_DEFAULT;
    }
};

export const SaveVideoSettings = (settings: VideoSettings): VideoSettings =>
{
    const normalized = normalize(settings);

    try
    {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
    catch
    {
        // localStorage pode falhar em modo privado, mas não deve quebrar o Nitro.
    }

    ApplyVideoSettingsRuntime(normalized);

    return normalized;
};

export const ApplyVideoSettingsBeforeBootstrap = (settings: VideoSettings = LoadVideoSettings()): void =>
{
    applyConfiguration(settings);
};

export const ApplyVideoSettingsRuntime = (settings: VideoSettings = LoadVideoSettings()): void =>
{
    applyConfiguration(settings);
    applyCssMode(settings);
};

const applyConfiguration = (settings: VideoSettings): void =>
{
    const animationFps = settings.performanceMode === 'performance'
        ? 20
        : settings.performanceMode === 'quality'
            ? 30
            : 24;

    setNitroConfigValue('system.fps.max', settings.fpsMax);
    setNitroConfigValue('system.fps.animation', animationFps);

    setNitroConfigValue('rio.video.scale.quality', settings.scaleQuality);
    setNitroConfigValue('rio.video.gpu.precision', settings.gpuPrecision);
    setNitroConfigValue('rio.video.performance.mode', settings.performanceMode);
    setNitroConfigValue('rio.video.data.flow', settings.dataFlow);
    setNitroConfigValue('rio.video.graphic.stability', settings.graphicStability);
    setNitroConfigValue('rio.video.antialias', settings.antialias);

    setNitroConfigValue('room.color.skip.transition', settings.performanceMode !== 'quality');
    setNitroConfigValue('room.landscapes.enabled', settings.performanceMode !== 'performance');
};

const applyCssMode = (settings: VideoSettings): void =>
{
    if(!document || !document.documentElement) return;

    const root = document.documentElement;

    root.classList.toggle('nitro-video-quality', settings.scaleQuality === 'quality');
    root.classList.toggle('nitro-video-balanced', settings.scaleQuality === 'balanced');
    root.classList.toggle('nitro-video-performance', settings.scaleQuality === 'performance');

    root.classList.toggle('nitro-video-antialias', settings.antialias);
    root.classList.toggle('nitro-video-no-antialias', !settings.antialias);
};
