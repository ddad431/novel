export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    interval: number
): (...args: Parameters<T>) => void {
    let lastTime: number = 0;

    return function(this: ThisParameterType<T>, ...params: Parameters<T>) {
        const now = Date.now();

        if (now - lastTime >= interval) {
            fn.apply(this, params);
            lastTime = now;
        }
    };
}