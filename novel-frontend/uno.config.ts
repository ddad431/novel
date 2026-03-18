import type { PresetOrFactoryAwaitable } from 'unocss';

import { defineConfig } from 'unocss';
import presetWind3 from '@unocss/preset-wind3';
import { presetApplet, presetRemRpx } from 'unocss-applet';

const isH5 = process.env?.UNI_PLATFORM === 'h5';
const platformPreset = isH5
    ? [presetWind3()]
    : [presetApplet(), presetRemRpx()];

export default defineConfig({
    presets: [
        ...platformPreset as PresetOrFactoryAwaitable<object>[],
    ],
    // shortcuts: [['center', 'flex justify-center items-center']],
});