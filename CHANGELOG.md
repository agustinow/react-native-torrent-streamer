# Changelog

## [0.3.0] - 2025-10-07

### 🎉 Major Update: React Native 0.76+ & Expo Support

This is a major modernization update bringing the library up to date with React Native 0.76+, Expo, and the New Architecture.

### ✨ Added

- **Local HTTP Server**: Custom lightweight streaming server
  - Uses Java ServerSocket (no external dependencies)
  - Returns `http://127.0.0.1:PORT/stream` URLs instead of file paths
  - Supports HTTP range requests for video seeking
  - Auto-assigns available port
  - Thread pool for handling multiple concurrent requests

- **Modern API**: New promise-based API (default export)
  - `TorrentStreamer.start()` returns `Promise<{ url, fileName, fileSize }>`
  - Simplified event handling
  - Better TypeScript support

- **TypeScript Support**:
  - Added `index.d.ts` with full type definitions
  - Type-safe API with interfaces for all events and responses

- **New Architecture Support**:
  - Added TurboModule spec in `src/NativeTorrentStreamer.ts`
  - Updated `package.json` with codegenConfig
  - Forward compatible with React Native's new architecture

- **Expo Support**:
  - Added `react-native.config.js` for better Expo integration
  - Works with expo-dev-client
  - Tested with Expo SDK 49+

- **Documentation**:
  - Comprehensive README with examples
  - Migration guide (MIGRATION.md)
  - TypeScript examples
  - Troubleshooting section

### 🔄 Changed

- **Gradle Configuration**:
  - Updated to Android Gradle Plugin 8.1.4 (from 3.4.1)
  - Replaced deprecated `jcenter()` with `mavenCentral()`
  - Added `namespace` to build.gradle (AGP 8.0 requirement)
  - Updated compile options to Java 17

- **Android SDK Versions**:
  - `compileSdkVersion`: 28 → 34
  - `minSdkVersion`: 16 → 26 (Android 8.0+)
  - `targetSdkVersion`: 28 → 34
  - `buildToolsVersion`: 28.0.3 → 34.0.0

- **Dependencies**:
  - Updated `androidx.annotation`: 1.1.0 → 1.7.0
  - Kept `TorrentStream-Android:2.8.0` (still works well)
  - No new external dependencies (custom HTTP server uses Java standard library)

- **Storage Behavior**:
  - Default save location: External Downloads → App cache directory
  - Uses Android 11+ scoped storage (no permissions needed)
  - Storage permissions scoped to Android 10 and below

- **API Surface**:
  - `start()` now returns stream info instead of void
  - Event data standardized (e.g., `downloadSpeed` → `downloadRate`)
  - Added `fileSize` to ready event
  - URLs now HTTP instead of file paths

### 🔧 Fixed

- **Android 11+ Compatibility**:
  - Fixed deprecated `WRITE_EXTERNAL_STORAGE` usage
  - Added `maxSdkVersion` to storage permissions
  - Added `READ_MEDIA_VIDEO` permission for Android 13+
  - Removed `package` attribute from AndroidManifest (now in build.gradle)

- **Gradle Build Issues**:
  - Fixed deprecated `classifier` → `archiveClassifier.set()`
  - Removed deprecated `maven` plugin
  - Fixed deprecated `compile` configuration
  - Updated `failOnError` in javadoc task

- **React Native Compatibility**:
  - Fixed for React Native 0.60+
  - Works with React Native 0.76+
  - Compatible with New Architecture

### 🏗️ Internal Changes

- Created `TorrentStreamServer.java` for HTTP streaming
- Updated `TorrentItem.java` to use HTTP server and app cache
- Updated `TorrentStreamerModule.java` to pass context
- Refactored `index.js` with new API while keeping legacy support
- Added proper TypeScript definitions

### 📦 Files Added

- `src/NativeTorrentStreamer.ts` - TurboModule spec
- `index.d.ts` - TypeScript definitions
- `react-native.config.js` - React Native CLI config
- `android/src/main/java/com/ghondar/torrentstreamer/TorrentStreamServer.java`
- `MIGRATION.md` - Migration guide
- `CHANGELOG.md` - This file

### 📦 Files Modified

- `package.json` - Updated version, added TypeScript support, added codegenConfig
- `android/build.gradle` - Modernized for AGP 8.0+
- `android/src/main/AndroidManifest.xml` - Updated permissions
- `android/src/main/java/com/ghondar/torrentstreamer/TorrentItem.java` - HTTP server integration
- `android/src/main/java/com/ghondar/torrentstreamer/TorrentStreamerModule.java` - Context passing
- `index.js` - New API with backward compatibility
- `README.md` - Complete rewrite with modern examples

### ⚠️ Breaking Changes

See [MIGRATION.md](./MIGRATION.md) for detailed migration guide.

**Summary of breaking changes:**
1. Minimum Android version: 16 → 26
2. URL format: `file://` → `http://127.0.0.1:PORT/stream`
3. Gradle requirements: AGP 8.0+, Gradle 7.0+
4. Event property names standardized
5. Default storage location changed (now uses app cache)

**Backward Compatibility:**
- Legacy `Torrent` class API still fully supported
- Automatic migration path available
- No immediate breaking changes for existing code

### 🙏 Credits

- Original library by Anthony Bryan Gavilan Vinces
- Modernization update for React Native 0.76+ and Expo
- Custom HTTP server implementation (Java ServerSocket)
- TorrentStream-Android for torrent functionality

---

## [0.2.3] and earlier

See git history for previous versions.
