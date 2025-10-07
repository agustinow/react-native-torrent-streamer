# Migration Guide: v0.2.x → v0.3.0

This guide helps you migrate from the old API (v0.2.x) to the new modernized API (v0.3.0).

## What's Changed

### ✅ New Features
- **Local HTTP Server**: Now returns `http://127.0.0.1:PORT/stream` URLs instead of file paths
- **Modern Promise-based API**: Simpler, cleaner interface
- **TypeScript Support**: Full type definitions included
- **React Native 0.76+ Support**: Works with latest RN and Expo
- **Android 11+ Scoped Storage**: No permissions needed
- **New Architecture Ready**: TurboModule support

### ⚠️ Breaking Changes
1. **API Syntax**: Class-based → Promise-based (old API still works)
2. **Return Values**: Now returns `{ url, fileName, fileSize }` from `start()`
3. **URLs**: Returns HTTP URLs instead of file paths
4. **Minimum Android Version**: minSdkVersion raised from 16 → 26
5. **Gradle Requirements**: Requires AGP 8.0+ and Gradle 7.0+

## Quick Migration

### Old API (Still Supported)
```javascript
import Torrent from 'react-native-torrent-streamer';

const torrent = new Torrent('magnet:?xt=urn:btih:...');
torrent.addEventListener('ready', (data) => {
  console.log(data.url); // file:// path
});
torrent.addEventListener('status', (data) => {
  console.log(data.progress);
});
await torrent.start();
torrent.stop();
```

### New API (Recommended)
```javascript
import TorrentStreamer from 'react-native-torrent-streamer';

// Set up listeners before starting
TorrentStreamer.addEventListener('status', (data) => {
  console.log(data.progress);
  console.log(data.downloadRate);
  console.log(data.numSeeds);
});

// Start returns a promise with stream info
const { url, fileName, fileSize } = await TorrentStreamer.start(
  'magnet:?xt=urn:btih:...'
);

console.log(url); // http://127.0.0.1:PORT/stream

// Stop when done
TorrentStreamer.stop();
```

## Detailed Changes

### 1. Import Changes

**Old:**
```javascript
import Torrent from 'react-native-torrent-streamer';
// or
import { Torrent } from 'react-native-torrent-streamer';
```

**New:**
```javascript
// Modern API (recommended)
import TorrentStreamer from 'react-native-torrent-streamer';

// Legacy API (still supported)
import { Torrent } from 'react-native-torrent-streamer';
```

### 2. Initialization

**Old:**
```javascript
const torrent = new Torrent(magnetUrl, saveLocation, removeAfterStop);
```

**New:**
```javascript
// No initialization needed - use directly
await TorrentStreamer.start(magnetUrl, {
  saveLocation: '/custom/path', // optional
  removeAfterStop: true // optional
});
```

### 3. Starting Stream

**Old:**
```javascript
await torrent.start();
// URL comes via 'ready' event
```

**New:**
```javascript
const { url, fileName, fileSize } = await TorrentStreamer.start(magnetUrl);
// URL available immediately in promise
```

### 4. Event Listeners

**Old:**
```javascript
torrent.addEventListener('ready', (data) => {
  console.log(data.url);
});

torrent.addEventListener('status', (data) => {
  console.log(data.progress);
  console.log(data.downloadSpeed);
  console.log(data.seeds);
});

torrent.addEventListener('error', (data) => {
  console.log(data.msg);
});
```

**New:**
```javascript
// Similar, but with standardized property names
const subscription = TorrentStreamer.addEventListener('status', (data) => {
  console.log(data.progress);
  console.log(data.downloadRate); // renamed from downloadSpeed
  console.log(data.numSeeds); // renamed from seeds
  console.log(data.buffer);
});

// Can remove listener
subscription.remove();
```

### 5. Stopping Stream

**Old:**
```javascript
torrent.stop();
torrent.clearEvents();
```

**New:**
```javascript
TorrentStreamer.stop(); // Automatically cleans up events
```

### 6. URL Format Change

**Old:**
```javascript
// Returns file:// path
file:///storage/emulated/0/Download/video.mp4
```

**New:**
```javascript
// Returns HTTP URL
http://127.0.0.1:52841/stream
```

**Important:** Update your video player to use the HTTP URL:
```javascript
<Video source={{ uri: httpUrl }} />
```

## Android Configuration Updates

### build.gradle Changes

**Old:**
```gradle
// android/build.gradle
compileSdkVersion 28
minSdkVersion 16
targetSdkVersion 28

repositories {
    jcenter() // deprecated
}
```

**New:**
```gradle
// android/build.gradle
compileSdkVersion 34
minSdkVersion 26
targetSdkVersion 34

repositories {
    mavenCentral() // replaced jcenter
    maven { url "https://jitpack.io" }
}
```

### Gradle Plugin Version

**Old:**
```gradle
classpath 'com.android.tools.build:gradle:3.4.1'
```

**New:**
```gradle
classpath 'com.android.tools.build:gradle:8.1.4'
```

### AndroidManifest.xml

**Old:**
```xml
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

**New:**
```xml
<!-- Scoped to Android 10 and below -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
```

## Storage Location Changes

**Old Behavior:**
- Default: `/storage/emulated/0/Download/`
- Required storage permissions

**New Behavior:**
- Default: App-specific cache directory (no permissions needed)
- Custom location: Still supported via `saveLocation` option
- Android 11+ uses scoped storage automatically

## TypeScript Support

The new version includes TypeScript definitions:

```typescript
import TorrentStreamer, {
  TorrentStreamResult,
  TorrentProgressData
} from 'react-native-torrent-streamer';

// Fully typed
const result: TorrentStreamResult = await TorrentStreamer.start(magnetUri);

TorrentStreamer.addEventListener('status', (data: TorrentProgressData) => {
  // TypeScript knows about: progress, downloadRate, numSeeds, buffer
});
```

## Expo Integration

**New in v0.3.0:**
```bash
npx expo install react-native-torrent-streamer
npx expo prebuild --clean
npx expo run:android
```

Requires `expo-dev-client` for native modules.

## Common Migration Issues

### Issue: "URL not working in Video player"

**Cause:** Using old file:// URL format

**Solution:** The new version returns HTTP URLs. Make sure your video player component receives the HTTP URL:
```javascript
const { url } = await TorrentStreamer.start(magnetUri);
<Video source={{ uri: url }} /> // url is now http://...
```

### Issue: "Storage permission denied"

**Cause:** App targeting Android 11+ with old storage approach

**Solution:** Don't specify `saveLocation`, let the library use app cache:
```javascript
await TorrentStreamer.start(magnetUri); // Uses app cache (no permissions)
```

### Issue: "Build fails with namespace error"

**Cause:** Old Gradle version

**Solution:** Update to AGP 8.0+:
```gradle
classpath 'com.android.tools.build:gradle:8.1.4'
```

### Issue: "jcenter() repository not found"

**Cause:** jcenter is deprecated and removed

**Solution:** Replace with mavenCentral():
```gradle
repositories {
    mavenCentral()
    maven { url "https://jitpack.io" }
}
```

## Gradual Migration Strategy

You can migrate gradually:

1. **Update dependencies** and build configuration first
2. **Keep using the old API** (Torrent class) - it still works
3. **Gradually migrate** to new API as you update components
4. **Test thoroughly** with HTTP URLs in your video players

## Still Need Help?

- Check the [README.md](./README.md) for full API documentation
- Open an issue on GitHub
- The legacy API is fully supported for backward compatibility

## Summary

✅ **Recommended approach**: Use new default export API
✅ **Backward compatible**: Old Torrent class still works
✅ **Better performance**: HTTP streaming vs file access
✅ **Modern tools**: TypeScript, Expo, RN 0.76+
