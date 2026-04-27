export function _merge<T extends Object>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (result[key] && Object.getPrototypeOf(result[key]) === Object.prototype) {
                // @ts-ignore
                result[key] = _merge(result[key], source[key]);
            }
            else {
                // @ts-ignore
                result[key] = source[key];
            }
        }
    }

    return result;
}