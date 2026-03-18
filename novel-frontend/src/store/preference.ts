export type PageTurning = 
    | '覆盖翻页' 
    | '平移翻页' 
    | '无动画';
export type ReaderTheme = 
    | 'white'
    | 'green'
    | 'brown'
    | 'blue' 
    | 'dark';
export type Preference = {
    fontSize: number,
    pageTurning: PageTurning,
    theme: ReaderTheme,
    mode: 'light' | 'dark',
    colorscheme: {
        dark: 'dark',
        light: 'white' | 'green' | 'brown' | 'blue',
    }
};

const DEFAULT_PREFERENCE: Preference = {
    fontSize: 16,
    pageTurning: '覆盖翻页',
    theme: 'white',
    mode: 'light',
    colorscheme: {
        dark: 'dark',
        light: 'white',
    }
};

export const PreferenceStore = {
    getPreference,
    updatePreference,
};

function getPreference(): Preference {
    try {
        const preference = JSON.parse(uni.getStorageSync('preference') || '{}');
        if (Object.keys(preference).length === 0) {
            updatePreference(DEFAULT_PREFERENCE);
            return DEFAULT_PREFERENCE;
        }

        return preference;
    }
    catch (err) {
        console.log('Get preference fail:', err);
        throw err;
    }
}

function updatePreference(data: Preference) {
    uni.setStorageSync('preference', JSON.stringify(data));
}