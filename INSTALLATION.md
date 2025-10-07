# Installation Guide for Expo Apps

## Prerequisites

- Expo SDK 49+ with `expo-dev-client`
- Android minSdkVersion 26+
- Node.js and npm/yarn installed

## Step 1: Install the Library

### From Local Directory (for testing)

```bash
cd /path/to/your/expo-app

# Install from local path
npm install /path/to/react-native-torrent-streamer

# OR with yarn
yarn add file:/path/to/react-native-torrent-streamer
```

### From npm (once published)

```bash
npx expo install react-native-torrent-streamer
```

## Step 2: Install expo-dev-client (if not already)

```bash
npx expo install expo-dev-client
```

## Step 3: Configure Android

### 3.1 Update `android/build.gradle` (or `android/settings.gradle` for Gradle 7+)

Add JitPack repository:

**For Gradle 6 and below (`android/build.gradle`):**
```gradle
allprojects {
    repositories {
        // ... existing repositories
        maven { url 'https://jitpack.io' }
    }
}
```

**For Gradle 7+ (`android/settings.gradle`):**
```gradle
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // ... other repositories
        maven { url 'https://jitpack.io' }
    }
}
```

### 3.2 Verify SDK Versions (android/app/build.gradle)

Make sure your app meets minimum requirements:

```gradle
android {
    compileSdkVersion 34  // or higher

    defaultConfig {
        minSdkVersion 26     // minimum required
        targetSdkVersion 34  // or higher
    }
}
```

### 3.3 Add INTERNET Permission (should already exist)

Check `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest ...>
    <uses-permission android:name="android.permission.INTERNET" />
    <!-- ... rest of your manifest -->
</manifest>
```

## Step 4: Prebuild and Run

```bash
# Clean prebuild
npx expo prebuild --clean

# Run on Android device/emulator
npx expo run:android
```

## Step 5: Implement in Your Code

### Basic Implementation

```javascript
// App.js or your component
import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Video } from 'expo-av';
import TorrentStreamer from 'react-native-torrent-streamer';

export default function VideoStreamScreen() {
  const [videoUrl, setVideoUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [downloadRate, setDownloadRate] = useState(0);
  const [seeds, setSeeds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set up progress listener
    const subscription = TorrentStreamer.addEventListener('status', (data) => {
      setProgress(data.progress * 100);
      setDownloadRate(data.downloadRate);
      setSeeds(data.numSeeds);
    });

    return () => {
      subscription.remove();
      TorrentStreamer.stop();
    };
  }, []);

  const startStreaming = async () => {
    try {
      setLoading(true);
      setError(null);

      const magnetUri = 'magnet:?xt=urn:btih:YOUR_MAGNET_LINK';

      const { url, fileName, fileSize } = await TorrentStreamer.start(magnetUri);

      console.log('Stream ready!');
      console.log('URL:', url);
      console.log('File:', fileName);
      console.log('Size:', fileSize);

      setVideoUrl(url);
      setLoading(false);
    } catch (err) {
      console.error('Streaming error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const stopStreaming = () => {
    TorrentStreamer.stop();
    setVideoUrl(null);
    setProgress(0);
    setDownloadRate(0);
    setSeeds(0);
  };

  return (
    <View style={styles.container}>
      {videoUrl && (
        <Video
          source={{ uri: videoUrl }}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          shouldPlay
        />
      )}

      {loading && (
        <ActivityIndicator size="large" color="#0000ff" />
      )}

      {error && (
        <Text style={styles.error}>Error: {error}</Text>
      )}

      <View style={styles.controls}>
        <Button
          title={videoUrl ? "Stop Stream" : "Start Stream"}
          onPress={videoUrl ? stopStreaming : startStreaming}
          disabled={loading}
        />
      </View>

      {progress > 0 && (
        <View style={styles.stats}>
          <Text>Progress: {progress.toFixed(2)}%</Text>
          <Text>Speed: {(downloadRate / 1024 / 1024).toFixed(2)} MB/s</Text>
          <Text>Seeds: {seeds}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: 300,
  },
  controls: {
    padding: 20,
  },
  stats: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  error: {
    color: 'red',
    padding: 20,
  },
});
```

### Advanced Implementation with Custom Hook

```javascript
// hooks/useTorrentStream.js
import { useState, useEffect } from 'react';
import TorrentStreamer from 'react-native-torrent-streamer';

export function useTorrentStream() {
  const [state, setState] = useState({
    url: null,
    fileName: null,
    fileSize: 0,
    progress: 0,
    downloadRate: 0,
    seeds: 0,
    buffer: 0,
    error: null,
    isLoading: false,
  });

  useEffect(() => {
    const statusSub = TorrentStreamer.addEventListener('status', (data) => {
      setState(prev => ({
        ...prev,
        progress: data.progress,
        downloadRate: data.downloadRate,
        seeds: data.numSeeds,
        buffer: data.buffer,
      }));
    });

    const errorSub = TorrentStreamer.addEventListener('error', (data) => {
      setState(prev => ({
        ...prev,
        error: data.msg,
        isLoading: false,
      }));
    });

    return () => {
      statusSub.remove();
      errorSub.remove();
      TorrentStreamer.stop();
    };
  }, []);

  const start = async (magnetUri) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await TorrentStreamer.start(magnetUri);

      setState(prev => ({
        ...prev,
        url: result.url,
        fileName: result.fileName,
        fileSize: result.fileSize,
        isLoading: false,
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
      throw error;
    }
  };

  const stop = () => {
    TorrentStreamer.stop();
    setState({
      url: null,
      fileName: null,
      fileSize: 0,
      progress: 0,
      downloadRate: 0,
      seeds: 0,
      buffer: 0,
      error: null,
      isLoading: false,
    });
  };

  return {
    ...state,
    start,
    stop,
  };
}
```

**Using the custom hook:**

```javascript
import { useTorrentStream } from './hooks/useTorrentStream';

export default function VideoPlayer() {
  const { url, progress, downloadRate, seeds, isLoading, error, start, stop } =
    useTorrentStream();

  return (
    <View style={styles.container}>
      {url && <Video source={{ uri: url }} style={styles.video} />}

      <Button
        title={url ? "Stop" : "Start"}
        onPress={() => url ? stop() : start('magnet:?xt=...')}
      />

      {progress > 0 && (
        <Text>Progress: {(progress * 100).toFixed(2)}%</Text>
      )}
    </View>
  );
}
```

## Step 6: TypeScript Support (Optional)

If using TypeScript, the types are automatically included:

```typescript
import TorrentStreamer, {
  TorrentStreamResult,
  TorrentProgressData,
} from 'react-native-torrent-streamer';

const handleStream = async (magnetUri: string): Promise<void> => {
  const result: TorrentStreamResult = await TorrentStreamer.start(magnetUri);
  console.log(result.url); // TypeScript knows this is a string
};

TorrentStreamer.addEventListener('status', (data: TorrentProgressData) => {
  console.log(data.progress); // Fully typed
});
```

## Troubleshooting

### Issue: "Module not found: react-native-torrent-streamer"

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo prebuild --clean
```

### Issue: "Could not resolve com.github.TorrentStream:TorrentStream-Android"

**Solution:** Make sure JitPack is added to repositories (see Step 3.1)

### Issue: Build fails with namespace error

**Solution:** Update Android Gradle Plugin to 8.0+:
```gradle
// android/build.gradle
dependencies {
    classpath('com.android.tools.build:gradle:8.1.4')
}
```

### Issue: Video player doesn't start

**Solution:** Make sure you're waiting for enough buffer:
```javascript
const statusSub = TorrentStreamer.addEventListener('status', (data) => {
  if (data.buffer > 0.05) { // Wait for 5% buffer
    // Start playing
  }
});
```

### Issue: Port already in use

**Solution:** The library auto-assigns ports. If you still have issues:
```javascript
// Stop any previous instance
TorrentStreamer.stop();
// Then start again
await TorrentStreamer.start(magnetUri);
```

## Testing

1. **Use a well-seeded torrent** for testing (Big Buck Bunny is great):
```javascript
const magnetUri = 'magnet:?xt=urn:btih:88594aaacbde40ef3e2510c47374ec0aa396c08e&dn=bbb%5Fsunflower%5F1080p%5F30fps%5Fnormal.mp4';
```

2. **Test on real device** - Emulators may have network restrictions

3. **Check logs**:
```bash
npx react-native log-android
```

## Example Project Structure

```
your-expo-app/
├── App.js (or App.tsx)
├── screens/
│   └── VideoStreamScreen.js
├── hooks/
│   └── useTorrentStream.js
├── android/
│   ├── build.gradle (add JitPack)
│   └── settings.gradle (or here for Gradle 7+)
├── app.json
└── package.json
```

## Next Steps

- Implement error handling for network issues
- Add loading states and progress bars
- Handle multi-file torrents with `setSelectedFileIndex()`
- Add controls for pause/resume playback
- Implement cleanup on component unmount

## Support

If you encounter issues:
1. Check the [README.md](./README.md) for API documentation
2. Review [MIGRATION.md](./MIGRATION.md) if upgrading
3. Check [CHANGELOG.md](./CHANGELOG.md) for recent changes
4. Open an issue on GitHub with logs and environment details
