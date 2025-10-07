declare module 'react-native-torrent-streamer' {
  export interface TorrentStreamOptions {
    saveLocation?: string | null;
    removeAfterStop?: boolean;
  }

  export interface TorrentStreamResult {
    url: string;
    fileName: string;
    fileSize: number;
  }

  export interface TorrentProgressData {
    progress: number;
    downloadRate: number;
    numSeeds: number;
    buffer: number;
    sequentialProgress: number;
  }

  export interface TorrentEventSubscription {
    remove(): void;
  }

  export interface TorrentStreamer {
    /**
     * Start streaming a torrent
     * @param magnetUri - The magnet URI to stream
     * @param options - Optional configuration
     * @returns Promise resolving to stream URL, file name, and file size
     */
    start(magnetUri: string, options?: TorrentStreamOptions): Promise<TorrentStreamResult>;

    /**
     * Stop the current torrent stream
     */
    stop(): void;

    /**
     * Add event listener
     * @param event - Event type: 'progress', 'status', 'error', 'stop'
     * @param handler - Event handler
     * @returns Subscription object with remove() method
     */
    addEventListener(
      event: 'status',
      handler: (data: TorrentProgressData) => void
    ): TorrentEventSubscription;
    addEventListener(
      event: 'error',
      handler: (data: { msg: string; magnetUrl: string }) => void
    ): TorrentEventSubscription;
    addEventListener(
      event: 'stop',
      handler: (data: { msg: string; magnetUrl: string }) => void
    ): TorrentEventSubscription;
    addEventListener(
      event: 'progress',
      handler: (data: any) => void
    ): TorrentEventSubscription;

    /**
     * Remove event listener
     * @param event - Event type
     * @param handler - Event handler to remove
     */
    removeEventListener(event: string, handler: (...args: any[]) => void): void;

    /**
     * Set selected file index (for multi-file torrents)
     * @param index - File index (-1 for largest file)
     */
    setSelectedFileIndex(index: number): void;
  }

  // Legacy class-based API
  export class Torrent {
    magnetUrl: string;
    saveLocation: string | null;
    removeAfterStop: boolean;
    files: any[];

    constructor(magnetUrl: string, saveLocation?: string | null, removeAfterStop?: boolean);

    setSelectedFileIndex(selectedFileIndex: number): void;
    addEventListener(type: string, handler: (params: any) => void): this;
    clearEvents(): void;
    start(): Promise<void>;
    stop(): void;
    destroy(): void;
  }

  const TorrentStreamerInstance: TorrentStreamer;
  export default TorrentStreamerInstance;
}
