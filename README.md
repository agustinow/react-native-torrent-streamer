# React Native Torrent Streamer

> Stream torrents directly in your React Native app with sequential downloading and local HTTP server

**Android only** - Uses [TorrentStream-Android](https://github.com/TorrentStream/TorrentStream-Android) (libtorrent4j) for efficient sequential torrent downloading and streaming.

## Features

- ✅ **React Native 0.76+ & Expo Compatible** (with expo-dev-client)
- ✅ **New Architecture Support** (TurboModules ready)
- ✅ **Local HTTP Server** - Returns `http://127.0.0.1:PORT/stream` URLs
- ✅ **Sequential Downloading** - Optimized for video streaming
- ✅ **Android 11+ Scoped Storage** - No storage permissions needed
- ✅ **TypeScript Support** - Full type definitions included
- ✅ **Modern Promise-based API** - Simple and intuitive

## Requirements

- React Native 0.60+
- Android minSdkVersion 26 (Android 8.0+)
- Expo SDK 49+ (if using Expo)

## Installation

### NPM/Yarn

```bash
npm install react-native-torrent-streamer
# or
yarn add react-native-torrent-streamer
```

### Expo (with expo-dev-client)

```bash
npx expo install react-native-torrent-streamer
npx expo prebuild --clean
```

### Android Configuration

Add JitPack repository to your `android/build.gradle`:

```gradle
allprojects {
    repositories {
        // ... other repositories
        maven { url "https://jitpack.io" }
    }
}
```

For Gradle 7+, add to `android/settings.gradle`:

```gradle
dependencyResolutionManagement {
    repositories {
        // ... other repositories
        maven { url "https://jitpack.io" }
    }
}
```

## Usage

### Basic Example

```javascript
import TorrentStreamer from 'react-native-torrent-streamer';
import { Video } from 'expo-av';
import { useState } from 'react';

function VideoPlayer() {
  const [videoUrl, setVideoUrl] = useState(null);
  const [progress, setProgress] = useState(0);

  const startStreaming = async () => {
    try {
      // Set up progress listener
      TorrentStreamer.addEventListener('status', (data) => {
        console.log('Progress:', data.progress);
        console.log('Download rate:', data.downloadRate, 'bytes/s');
        console.log('Seeds:', data.numSeeds);
        setProgress(data.progress);
      });

      // Start streaming
      const { url, fileName, fileSize } = await TorrentStreamer.start(
        'magnet:?xt=urn:btih:...'
      );

      console.log('Stream URL:', url); // http://127.0.0.1:PORT/stream
      console.log('File name:', fileName);
      console.log('File size:', fileSize);

      setVideoUrl(url);
    } catch (error) {
      console.error('Streaming error:', error);
    }
  };

  const stopStreaming = () => {
    TorrentStreamer.stop();
    setVideoUrl(null);
  };

  return (
    <>
      {videoUrl && (
        <Video
          source={{ uri: videoUrl }}
          style={{ width: '100%', height: 300 }}
          useNativeControls
          shouldPlay
        />
      )}
      <Button title="Start" onPress={startStreaming} />
      <Button title="Stop" onPress={stopStreaming} />
      <Text>Progress: {(progress * 100).toFixed(2)}%</Text>
    </>
  );
}
```

## API Reference

### `TorrentStreamer.start(magnetUri, options?)`

Start streaming a torrent.

**Parameters:**
- `magnetUri` (string, required): The magnet URI to stream
- `options` (object, optional):
  - `saveLocation` (string): Custom save location (default: app cache dir)
  - `removeAfterStop` (boolean): Remove files after stop (default: true)

**Returns:** `Promise<{ url: string, fileName: string, fileSize: number }>`

**Example:**
```javascript
const result = await TorrentStreamer.start('magnet:?xt=urn:btih:...', {
  removeAfterStop: true
});
console.log(result.url); // http://127.0.0.1:PORT/stream
```

### `TorrentStreamer.stop()`

Stop the current torrent stream and clean up resources.

**Example:**
```javascript
TorrentStreamer.stop();
```

### `TorrentStreamer.addEventListener(event, handler)`

Add an event listener.

**Events:**
- `'status'` - Download progress updates
  - `progress` (number): Download progress (0-1)
  - `downloadRate` (number): Download speed in bytes/s
  - `numSeeds` (number): Number of seeds
  - `buffer` (number): Buffer progress (0-1)

- `'error'` - Error occurred
  - `msg` (string): Error message
  - `magnetUrl` (string): Magnet URI

- `'stop'` - Stream stopped
  - `msg` (string): Stop message
  - `magnetUrl` (string): Magnet URI

**Returns:** Subscription object with `remove()` method

**Example:**
```javascript
const subscription = TorrentStreamer.addEventListener('status', (data) => {
  console.log(`Progress: ${(data.progress * 100).toFixed(2)}%`);
  console.log(`Speed: ${(data.downloadRate / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`Seeds: ${data.numSeeds}`);
});

// Later, remove listener
subscription.remove();
```

### `TorrentStreamer.removeEventListener(event, handler)`

Remove a specific event listener.

### `TorrentStreamer.setSelectedFileIndex(index)`

Select which file to stream in multi-file torrents.

**Parameters:**
- `index` (number): File index (-1 for largest file, default behavior)

**Example:**
```javascript
TorrentStreamer.setSelectedFileIndex(0); // Select first file
```

## Advanced Usage

### With React Hooks

```javascript
import { useEffect, useRef } from 'react';

function useTorrentStream(magnetUri) {
  const [state, setState] = useState({
    url: null,
    fileName: null,
    progress: 0,
    downloadRate: 0,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    const statusSubscription = TorrentStreamer.addEventListener('status', (data) => {
      if (mounted) {
        setState(prev => ({
          ...prev,
          progress: data.progress,
          downloadRate: data.downloadRate
        }));
      }
    });

    const errorSubscription = TorrentStreamer.addEventListener('error', (data) => {
      if (mounted) {
        setState(prev => ({ ...prev, error: data.msg }));
      }
    });

    TorrentStreamer.start(magnetUri)
      .then(({ url, fileName, fileSize }) => {
        if (mounted) {
          setState(prev => ({ ...prev, url, fileName, fileSize }));
        }
      })
      .catch(error => {
        if (mounted) {
          setState(prev => ({ ...prev, error: error.message }));
        }
      });

    return () => {
      mounted = false;
      statusSubscription.remove();
      errorSubscription.remove();
      TorrentStreamer.stop();
    };
  }, [magnetUri]);

  return state;
}
```

### Multiple File Selection

```javascript
// Listen for file list
TorrentStreamer.addEventListener('progress', (data) => {
  if (data.files) {
    console.log('Available files:', data.files);
    // Select a specific file
    TorrentStreamer.setSelectedFileIndex(0);
  }
});
```

## Troubleshooting

### Build Errors

**"namespace not specified"** - Make sure you're using Android Gradle Plugin 8.0+:
```gradle
// android/build.gradle
classpath 'com.android.tools.build:gradle:8.1.4'
```

**"jcenter() not found"** - Update repositories to use `mavenCentral()` instead of `jcenter()`

### Expo Issues

Make sure you're using `expo-dev-client`:
```bash
npx expo install expo-dev-client
npx expo prebuild --clean
npx expo run:android
```

### Storage Permissions

On Android 11+ (API 30+), the library uses app-specific storage (no permissions needed). For custom save locations on older Android versions, you may need to request storage permissions in your app.

## Legacy API (Deprecated)

The old class-based API is still supported for backward compatibility:

```javascript
import { Torrent } from 'react-native-torrent-streamer';

const torrent = new Torrent('magnet:?xt=urn:btih:...');
torrent.addEventListener('ready', (data) => {
  console.log(data.url);
});
await torrent.start();
```

**Note:** The new API (default export) is recommended for all new projects.

## How It Works

1. **Torrent Download**: Uses libtorrent4j for efficient torrent downloading with sequential mode
2. **Local HTTP Server**: Custom lightweight server (Java ServerSocket) serves the downloading file via HTTP
3. **Streaming**: Returns `http://127.0.0.1:PORT/stream` URL that works with any video player
4. **Range Requests**: Supports HTTP range requests for seeking (critical for video players)

## Performance Tips

- Use torrents with good seed count for faster streaming
- The library automatically enables sequential downloading
- Files are cached in app-specific storage by default
- Use `removeAfterStop: true` to automatically clean up files

## Limitations

- **Android only** (no iOS support)
- Single torrent at a time (calling `start()` again stops the previous stream)
- Video player must support HTTP streaming (expo-av works great)

## Contributing

Contributions are welcome! Please open an issue or PR.

## License

MIT

## Credits

- Original library by [Anthony Bryan Gavilan Vinces](https://github.com/ghondar)
- Updated for RN 0.76+ and Expo compatibility
- Uses [TorrentStream-Android](https://github.com/TorrentStream/TorrentStream-Android) for torrent streaming
- Custom lightweight HTTP server (no external dependencies)
