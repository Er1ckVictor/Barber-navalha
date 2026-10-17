export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
// quanto de [a, b] já foi percorrido, de 0 a 1
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const ease = (t: number) => t * t * (3 - 2 * t);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
