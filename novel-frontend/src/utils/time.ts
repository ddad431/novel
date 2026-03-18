export function getCurTime() {
    return (new Date())
        .toLocaleTimeString('zh-Cn', { hour: '2-digit', minute: '2-digit' });
}