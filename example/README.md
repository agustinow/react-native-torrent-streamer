# Torrent Streamer Example App

Test the react-native-torrent-streamer library standalone.

## Quick Start

```bash
# Install dependencies
cd example
npm install

# Run on Android
npm run android
```

## What This Tests

- ✅ Modern API (`TorrentStreamer.start()`)
- ✅ HTTP Server (returns `http://127.0.0.1:PORT/stream`)
- ✅ Event listeners (progress, status, error)
- ✅ Download progress tracking
- ✅ Stream URL generation

## Features

- **Start Stream**: Tests torrent downloading with Big Buck Bunny (well-seeded)
- **Progress Tracking**: Shows download speed, seeds, and buffer
- **Stream URL**: Displays the HTTP URL that can be used in video players
- **Error Handling**: Shows errors if something goes wrong

## Testing Tips

1. **Use a real device**: Emulators may have network restrictions
2. **Check logs**: `npx react-native log-android`
3. **Look for**: "HTTP server started on port: XXXX"
4. **Copy the URL**: Once streaming starts, you can copy the URL and test it in a browser or video player

## Troubleshooting

### Build fails
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Dependencies issues
```bash
rm -rf node_modules
npm install
```

### Can't find library
Make sure you're in the example directory and the parent library is built:
```bash
cd ..
npm install
cd example
npm install
npm run android
```

## Expected Output

When you press "Start Stream", you should see:
1. Loading indicator
2. Connection to peers
3. Stream URL appears (e.g., `http://127.0.0.1:52841/stream`)
4. Progress bar updates
5. Download speed and seed count

The URL can be used in any HTTP-compatible video player!
