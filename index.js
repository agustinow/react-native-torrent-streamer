import { DeviceEventEmitter, NativeModules } from 'react-native';

const { TorrentStreamer } = NativeModules;

const TORRENT_STREAMER_DOWNLOAD_EVENTS = {
  error: 'error',
  progress: 'progress',
  status: 'status',
  ready: 'ready',
  stop: 'stop'
};


export class Torrent {
  constructor(magnetUrl, saveLocation, removeAfterStop) {
    this.magnetUrl = magnetUrl;
    this.saveLocation = saveLocation;
    this.removeAfterStop = removeAfterStop;
    this.files = [];
    this._TorrentStreamerDownloadHandlers = {};
    if (!this.magnetUrl)
      throw "magnetUrl cant be empty";

    if (!this.saveLocation)
      this.saveLocation = null;

    if (!this.removeAfterStop)
      this.removeAfterStop = true;

    this.addEventListener("progress", (params) => {
      if (this.files.length <= 0)
        this.files = params.files;

      this.setSelectedFileIndex(-1);
    });
  }

  setSelectedFileIndex(selectedFileIndex) {
    TorrentStreamer.setSelectedFileIndex(this.magnetUrl, selectedFileIndex);
  }

  addEventListener(type, handler) {
    var ty = TORRENT_STREAMER_DOWNLOAD_EVENTS[type] + this.magnetUrl;
    this._TorrentStreamerDownloadHandlers[handler] = DeviceEventEmitter.addListener(ty, (torrentStreamerData) => {
      var tr = Object.assign({}, this);
      delete tr._TorrentStreamerDownloadHandlers;

      handler(Object.assign(torrentStreamerData, { torrent: tr }))
    });

    return this;
  }

  clearEvents() {
    Object.keys(this._TorrentStreamerDownloadHandlers).forEach(x => {
      var item = this._TorrentStreamerDownloadHandlers[x];
      if (item && item.remove) {
        item.remove();
        delete this._TorrentStreamerDownloadHandlers[x];
      }
    })
  }

  async start() {
    await TorrentStreamer.createTorrent(this.magnetUrl, this.saveLocation, this.removeAfterStop);
    TorrentStreamer.start(this.magnetUrl);
  }

  stop() {
    TorrentStreamer.stop(this.magnetUrl);
  }

  destroy() {
    TorrentStreamer.stop(this.magnetUrl);
  }
}

export default Torrent