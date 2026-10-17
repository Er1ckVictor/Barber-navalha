// Wrapper do localStorage que dispara um evento a cada escrita, pros hooks
// atualizarem na mesma aba. Mudanças vindas de outra aba chegam pelo evento `storage`.
const EVENTO = 'navalha:storage';

export function ler<T>(chave: string, padrao: T): T {
  if (typeof window === 'undefined') return padrao;
  try {
    const raw = localStorage.getItem(chave);
    return raw === null ? padrao : (JSON.parse(raw) as T);
  } catch {
    return padrao;
  }
}

export function lerBruto(chave: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

export function gravar(chave: string, valor: unknown) {
  try {
    if (valor === null || valor === undefined) localStorage.removeItem(chave);
    else localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // aba anônima ou storage cheio, só ignora
  }
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: chave }));
}

export function assinar(callback: () => void) {
  const onStorage = () => callback();
  window.addEventListener(EVENTO, onStorage);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENTO, onStorage);
    window.removeEventListener('storage', onStorage);
  };
}
