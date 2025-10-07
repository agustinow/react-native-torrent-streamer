import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  createTorrent(magnetUrl: string, location: string | null, removeAfterStop: boolean): void;
  start(magnetUrl: string): void;
  stop(magnetUrl: string): void;
  destroy(magnetUrl: string): void;
  setSelectedFileIndex(magnetUrl: string, selectedFileIndex: number): void;
  open(url: string, type: string): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('TorrentStreamer');
