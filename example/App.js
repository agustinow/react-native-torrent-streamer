/**
 * Torrent Streamer Example App
 * Tests the modern API with HTTP streaming
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import TorrentStreamer from 'react-native-torrent-streamer';

export default function App() {
  const [streamUrl, setStreamUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [progress, setProgress] = useState(0);
  const [downloadRate, setDownloadRate] = useState(0);
  const [seeds, setSeeds] = useState(0);
  const [buffer, setBuffer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Big Buck Bunny - well-seeded test torrent
  const testMagnetUri =
    'magnet:?xt=urn:btih:88594aaacbde40ef3e2510c47374ec0aa396c08e&dn=bbb%5Fsunflower%5F1080p%5F30fps%5Fnormal.mp4';

  useEffect(() => {
    // Set up event listeners
    const statusSub = TorrentStreamer.addEventListener('status', (data) => {
      setProgress(data.progress);
      setDownloadRate(data.downloadRate);
      setSeeds(data.numSeeds);
      setBuffer(data.buffer);
    });

    const errorSub = TorrentStreamer.addEventListener('error', (data) => {
      console.error('Torrent error:', data);
      setError(data.msg);
      setIsLoading(false);
      Alert.alert('Error', data.msg);
    });

    const stopSub = TorrentStreamer.addEventListener('stop', (data) => {
      console.log('Stream stopped:', data.msg);
    });

    return () => {
      statusSub.remove();
      errorSub.remove();
      stopSub.remove();
      TorrentStreamer.stop();
    };
  }, []);

  const handleStart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting stream...');

      const result = await TorrentStreamer.start(testMagnetUri);

      console.log('✅ Stream ready!');
      console.log('URL:', result.url);
      console.log('File:', result.fileName);
      console.log('Size:', formatBytes(result.fileSize));

      setStreamUrl(result.url);
      setFileName(result.fileName);
      setFileSize(result.fileSize);
      setIsLoading(false);

      Alert.alert(
        'Stream Ready!',
        `File: ${result.fileName}\nURL: ${result.url}\n\nYou can now play this URL in a video player.`,
      );
    } catch (err) {
      console.error('Failed to start stream:', err);
      setError(err.message);
      setIsLoading(false);
      Alert.alert('Error', err.message);
    }
  };

  const handleStop = () => {
    TorrentStreamer.stop();
    setStreamUrl(null);
    setFileName('');
    setFileSize(0);
    setProgress(0);
    setDownloadRate(0);
    setSeeds(0);
    setBuffer(0);
    setError(null);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Torrent Streamer Test</Text>
        <Text style={styles.subtitle}>React Native 0.76+ with HTTP Streaming</Text>

        {/* Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          {streamUrl ? (
            <>
              <Text style={styles.statusActive}>🟢 Active Stream</Text>
              <Text style={styles.infoText}>File: {fileName}</Text>
              <Text style={styles.infoText}>Size: {formatBytes(fileSize)}</Text>
              <View style={styles.urlContainer}>
                <Text style={styles.urlLabel}>Stream URL:</Text>
                <Text style={styles.urlText} selectable>
                  {streamUrl}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.statusInactive}>⚪ No Active Stream</Text>
          )}
        </View>

        {/* Progress Card */}
        {streamUrl && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Download Progress</Text>

            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress:</Text>
              <Text style={styles.progressValue}>
                {(progress * 100).toFixed(2)}%
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Download Speed</Text>
                <Text style={styles.statValue}>
                  {formatBytes(downloadRate)}/s
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Seeds</Text>
                <Text style={styles.statValue}>{seeds}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Buffer</Text>
                <Text style={styles.statValue}>
                  {(buffer * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Error Card */}
        {error && (
          <View style={[styles.card, styles.errorCard]}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.buttonContainer}>
          {!streamUrl ? (
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={handleStart}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>▶️ Start Stream</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStop}>
              <Text style={styles.buttonText}>⏹️ Stop Stream</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ How to Use</Text>
          <Text style={styles.infoDesc}>
            1. Press "Start Stream" to begin torrenting{'\n'}
            2. Wait for peers to connect{'\n'}
            3. Copy the Stream URL and use it in a video player{'\n'}
            4. The URL works with any HTTP-compatible player
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statusActive: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 8,
  },
  statusInactive: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  urlContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  urlLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  urlText: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  startButton: {
    backgroundColor: '#007AFF',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoDesc: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
});
