type SelectOption = {
    count: number,
    extension: string | Array<string>,
};

export function selectFile(option: SelectOption) {
    // #ifdef H5
    return new Promise((resolve, reject) => {
        uni.chooseFile({
            count: option.count,
            extension: (typeof option.extension === 'string') ? [option.extension] : option.extension,
            success: (res) => {
                resolve(option.count === 1 ? res.tempFiles[0] : res.tempFiles);
            },
            fail: (err) => {
                reject(err);
            },
        });
    });
    // #endif

    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
        // @ts-ignore
        wx.chooseMessageFile({
            count: option.count,
            type: 'file',
            extension: (typeof option.extension === 'string') ? [option.extension] : option.extension,
            success: (res: any) => {
                resolve(option.count === 1 ? res.tempFiles[0] : res.tempFiles);
            },
            fail: (err: any) => {
                reject(err);
            },
        });
    });
    // #endif
}