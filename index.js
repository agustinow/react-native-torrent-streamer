import { DeviceEventEmitter, NativeModules } from 'react-native';

const { TorrentStreamer: NativeTorrentStreamer } = NativeModules;

const TORRENT_STREAMER_EVENTS = {
  error: 'error',
  progress: 'progress',
  status: 'status',
  ready: 'ready',
  stop: 'stop'
};

// Internal state
let currentMagnetUrl = null;
let eventListeners = {};
let eventSubscriptions = {};

// Helper function to reattach all event listeners with correct magnetUrl
function reattachEventListeners() {
  // Remove old subscriptions
  Object.keys(eventSubscriptions).forEach(key => {
    const subscription = eventSubscriptions[key];
    if (subscription && subscription.remove) {
      subscription.remove();
    }
  });
  eventSubscriptions = {};

  // Reattach with correct magnetUrl
  Object.keys(eventListeners).forEach(event => {
    const handlers = eventListeners[event] || [];
    if (handlers.length > 0) {
      const nativeListener = (data) => {
        // Transform data to match expected format
        let transformedData = data;

        if (event === 'status') {
          transformedData = {
            progress: parseFloat(data.progress || 0),
            downloadRate: parseFloat(data.downloadSpeed || 0),
            numSeeds: parseInt(data.seeds || 0),
            buffer: parseFloat(data.buffer || 0)
          };
        }

        // Call all registered handlers
        handlers.forEach(h => h(transformedData));
      };

      const eventName = currentMagnetUrl
        ? TORRENT_STREAMER_EVENTS[event] + currentMagnetUrl
        : TORRENT_STREAMER_EVENTS[event];

      const subscription = DeviceEventEmitter.addListener(eventName, nativeListener);
      eventSubscriptions[event] = subscription;
    }
  });
}

// Modern API (default export)
const TorrentStreamer = {
  /**
   * Start streaming a torrent
   * @param {string} magnetUri - The magnet URI to stream
   * @param {object} options - Optional configuration
   * @param {string} options.saveLocation - Custom save location (optional)
   * @param {boolean} options.removeAfterStop - Remove files after stop (default: true)
   * @returns {Promise<{url: string, fileName: string, fileSize: number}>}
   */
  start(magnetUri, options = {}) {
    const { saveLocation = null, removeAfterStop = true } = options;

    if (!magnetUri) {
      return Promise.reject(new Error('magnetUri cannot be empty'));
    }

    // Clean up previous session
    if (currentMagnetUrl) {
      this.stop();
    }

    currentMagnetUrl = magnetUri;
    reattachEventListeners();

    return new Promise((resolve, reject) => {
      let readySubscription, errorSubscription, progressSubscription;

      // Set up one-time ready listener
      const readyListener = (data) => {
        if (data.magnetUrl === magnetUri) {
          resolve({
            url: data.url,
            fileName: data.fileName,
            fileSize: data.fileSize
          });
          // Remove listeners
          readySubscription?.remove();
          errorSubscription?.remove();
          progressSubscription?.remove();
        }
      };

      // Set up one-time error listener
      const errorListener = (data) => {
        if (data.magnetUrl === magnetUri) {
          reject(new Error(data.msg));
          // Remove listeners
          readySubscription?.remove();
          errorSubscription?.remove();
          progressSubscription?.remove();
        }
      };

      // Set up progress listener to auto-select largest file
      const progressListener = (data) => {
        if (data.magnetUrl === magnetUri && data.files && data.files.length > 0) {
          // Automatically select largest file (-1 = largest file)
          NativeTorrentStreamer.setSelectedFileIndex(magnetUri, -1);
        }
      };

      readySubscription = DeviceEventEmitter.addListener(TORRENT_STREAMER_EVENTS.ready + magnetUri, readyListener);
      errorSubscription = DeviceEventEmitter.addListener(TORRENT_STREAMER_EVENTS.error + magnetUri, errorListener);
      progressSubscription = DeviceEventEmitter.addListener(TORRENT_STREAMER_EVENTS.progress + magnetUri, progressListener);

      // Start the torrent
      NativeTorrentStreamer.createTorrent(magnetUri, saveLocation, removeAfterStop);
      NativeTorrentStreamer.start(magnetUri);
    });
  },

  /**
   * Stop the current torrent stream
   */
  stop() {
    if (currentMagnetUrl) {
      NativeTorrentStreamer.stop(currentMagnetUrl);
      // Clean up all event listeners
      Object.keys(eventSubscriptions).forEach(key => {
        const subscription = eventSubscriptions[key];
        if (subscription && subscription.remove) {
          subscription.remove();
        }
      });
      eventSubscriptions = {};
      currentMagnetUrl = null;
      reattachEventListeners();
    }
  },

  /**
   * Add event listener
   * @param {string} event - Event type: 'progress', 'status', 'error', 'stop'
   * @param {function} handler - Event handler
   * @returns {object} Subscription object with remove() method
   */
  addEventListener(event, handler) {
    if (!TORRENT_STREAMER_EVENTS[event]) {
      console.warn(`Unknown event type: ${event}`);
      return { remove: () => {} };
    }

    const listeners = eventListeners[event] || [];
    listeners.push(handler);
    eventListeners[event] = listeners;

    // Set up native listener if not already set
    const subscriptionKey = event;
    if (!eventSubscriptions[subscriptionKey]) {
      const nativeListener = (data) => {
        // Transform data to match expected format
        let transformedData = data;

        if (event === 'status') {
          transformedData = {
            progress: parseFloat(data.progress || 0),
            downloadRate: parseFloat(data.downloadSpeed || 0),
            numSeeds: parseInt(data.seeds || 0),
            buffer: parseFloat(data.buffer || 0)
          };
        }

        // Call all registered handlers
        const handlers = eventListeners[event] || [];
        handlers.forEach(h => h(transformedData));
      };

      const eventName = currentMagnetUrl
        ? TORRENT_STREAMER_EVENTS[event] + currentMagnetUrl
        : TORRENT_STREAMER_EVENTS[event];

      const subscription = DeviceEventEmitter.addListener(eventName, nativeListener);
      eventSubscriptions[subscriptionKey] = subscription;
    }

    // Return subscription object
    return {
      remove: () => {
        const index = listeners.indexOf(handler);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  },

  /**
   * Remove event listener
   * @param {string} event - Event type
   * @param {function} handler - Event handler to remove
   */
  removeEventListener(event, handler) {
    const listeners = eventListeners[event] || [];
    const index = listeners.indexOf(handler);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  },

  /**
   * Set selected file index (for multi-file torrents)
   * @param {number} index - File index (-1 for largest file)
   */
  setSelectedFileIndex(index) {
    if (currentMagnetUrl) {
      NativeTorrentStreamer.setSelectedFileIndex(currentMagnetUrl, index);
    }
  }
};

export default TorrentStreamer;