import { Capacitor } from '@capacitor/core';

export async function initOta() {
  if (!Capacitor.isNativePlatform()) return;
  const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
  await CapacitorUpdater.notifyAppReady();
}
