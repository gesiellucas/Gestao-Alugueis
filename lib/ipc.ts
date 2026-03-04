'use client';

/**
 * Isomorphic IPC helper.
 * - In Electron: delegates to window.electronAPI.invoke()
 * - In browser (Next.js dev/web): throws, because IPC doesn't exist
 *
 * Use isElectron() to guard Electron-only code paths.
 */

export function isElectron(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.electronAPI !== 'undefined' &&
    window.electronAPI?.isElectron === true
  );
}

export async function ipcInvoke<T = unknown>(
  channel: ElectronChannel,
  args?: unknown
): Promise<T> {
  if (!isElectron() || !window.electronAPI) {
    throw new Error(
      `ipcInvoke("${channel}") foi chamado fora do Electron. ` +
      'Use isElectron() para verificar o ambiente antes de chamar este helper.'
    );
  }
  return window.electronAPI.invoke<T>(channel, args);
}
