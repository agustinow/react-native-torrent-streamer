package com.ghondar.torrentstreamer;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Arguments;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import java.io.File;
import java.util.Map;
import java.util.HashMap;
import com.frostwire.jlibtorrent.FileStorage;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.github.se_bastiaan.torrentstream.StreamStatus;
import com.github.se_bastiaan.torrentstream.Torrent;
import com.github.se_bastiaan.torrentstream.TorrentOptions;
import com.github.se_bastiaan.torrentstream.TorrentStream;
import com.github.se_bastiaan.torrentstream.listeners.TorrentListener;

public class TorrentItem implements TorrentListener {
    private TorrentStream mTorrentStream = null;
    private final String magnetUrl;
    private final ICommand command;
    private Torrent _torrent = null;
    private final String _location;
    private TorrentStreamServer httpServer = null;
    private final Context context;
    private int selectedFileIndex = -1;
    private long selectedFileSize = 0;

    public TorrentItem(String magnetUrl, String location, Boolean removeAfterStop, ICommand command, Context context) {
        this.context = context;

        // Use app-specific storage (Android 11+ compatible)
        if (location == null) {
            File cacheDir = context.getCacheDir();
            location = new File(cacheDir, "torrents").getAbsolutePath();
        }

        this._location = location;
        this.magnetUrl = magnetUrl;
        TorrentOptions torrentOptions = new TorrentOptions.Builder()
                .saveLocation(location)
                .maxConnections(200)
                .autoDownload(true)
                .removeFilesAfterStop(removeAfterStop)
                .build();

        this.mTorrentStream = TorrentStream.init(torrentOptions);
        this.mTorrentStream.addListener(this);
        this.command = command;
    }

    public void start() {
        this.mTorrentStream.startStream(this.magnetUrl);
    }

    public void stop() {
        if (this.mTorrentStream != null && this.mTorrentStream.isStreaming()) {
            this.mTorrentStream.stopStream();
        }
        if (this.httpServer != null) {
            this.httpServer.stop();
            this.httpServer = null;
        }
    }

    public void setSelectedFileIndex(Integer selectedFileIndex) {
        if (this._torrent != null) {
            this._torrent.setSelectedFileIndex(selectedFileIndex);
            this.selectedFileIndex = selectedFileIndex;

            // Get the selected file size for progress calculation
            FileStorage fileStorage = this._torrent.getTorrentHandle().torrentFile().files();
            int actualIndex = selectedFileIndex;

            // If -1, find the largest file
            if (actualIndex == -1) {
                long maxSize = 0;
                for (int i = 0; i < fileStorage.numFiles(); i++) {
                    long fileSize = fileStorage.fileSize(i);
                    if (fileSize > maxSize) {
                        maxSize = fileSize;
                        actualIndex = i;
                    }
                }
            }

            if (actualIndex >= 0 && actualIndex < fileStorage.numFiles()) {
                this.selectedFileSize = fileStorage.fileSize(actualIndex);
            }
        }
    }

    private WritableArray getFileInfos() {
        FileStorage fileStorage = this._torrent.getTorrentHandle().torrentFile().files();
        WritableArray infos = Arguments.createArray();
        for (int i = 0; i < fileStorage.numFiles(); i++) {
            WritableMap info = Arguments.createMap();
            info.putString("path", this._location + "/" + fileStorage.filePath(i));
            info.putString("fileName", fileStorage.fileName(i));
            info.putDouble("size", fileStorage.fileSize(i));
            infos.pushMap(info);
        }
        return infos;
    }

    @Override
    public void onStreamPrepared(Torrent torrent) {
        WritableMap params = Arguments.createMap();
        params.putString("magnetUrl", "" + this.magnetUrl);
        params.putString("data", "OnStreamPrepared");
        this.command.sendEvent(this.magnetUrl, "progress", params);
    }

    @Override
    public void onStreamStarted(Torrent torrent) {
        this._torrent = torrent;
        WritableMap params = Arguments.createMap();
        params.putString("magnetUrl", "" + this.magnetUrl);
        params.putArray("files", this.getFileInfos());
        params.putString("data", "onStreamStarted");
        this.command.sendEvent(this.magnetUrl, "progress", params);
    }

    @Override
    public void onStreamError(Torrent torrent, Exception e) {
        WritableMap params = Arguments.createMap();
        params.putString("magnetUrl", "" + this.magnetUrl);
        params.putString("msg", e.getMessage());
        this.command.sendEvent(this.magnetUrl, "error", params);
    }

    @Override
    public void onStreamReady(Torrent torrent) {
        try {
            // Start HTTP server if not already running
            if (this.httpServer == null) {
                this.httpServer = new TorrentStreamServer(0); // 0 = auto-assign port
            }

            File videoFile = torrent.getVideoFile();
            this.httpServer.setVideoFile(videoFile);

            WritableMap params = Arguments.createMap();
            params.putString("magnetUrl", this.magnetUrl);
            params.putString("url", this.httpServer.getServerUrl());
            params.putString("fileName", torrent.getTorrentHandle().name());
            params.putDouble("fileSize", videoFile.length());
            this.command.sendEvent(this.magnetUrl, "ready", params);
        } catch (Exception e) {
            WritableMap errorParams = Arguments.createMap();
            errorParams.putString("magnetUrl", this.magnetUrl);
            errorParams.putString("msg", "Failed to start HTTP server: " + e.getMessage());
            this.command.sendEvent(this.magnetUrl, "error", errorParams);
        }
    }

    @Override
    public void onStreamProgress(Torrent torrent, StreamStatus status) {
        WritableMap params = Arguments.createMap();
        params.putString("magnetUrl", "" + this.magnetUrl);
        params.putString("buffer", "" + status.bufferProgress);
        params.putString("downloadSpeed", "" + status.downloadSpeed);

        // Calculate progress based on selected file only
        float fileProgress = status.progress;
        if (this.selectedFileSize > 0 && torrent.getTorrentHandle() != null) {
            try {
                FileStorage fileStorage = torrent.getTorrentHandle().torrentFile().files();
                int actualIndex = this.selectedFileIndex;

                // If -1, find the largest file index
                if (actualIndex == -1) {
                    long maxSize = 0;
                    for (int i = 0; i < fileStorage.numFiles(); i++) {
                        long fileSize = fileStorage.fileSize(i);
                        if (fileSize > maxSize) {
                            maxSize = fileSize;
                            actualIndex = i;
                        }
                    }
                }

                if (actualIndex >= 0 && actualIndex < fileStorage.numFiles()) {
                    // Get piece range for this file
                    long pieceSize = torrent.getTorrentHandle().torrentFile().pieceLength();
                    long fileOffset = fileStorage.fileOffset(actualIndex);
                    long fileSize = fileStorage.fileSize(actualIndex);

                    int firstPiece = (int) (fileOffset / pieceSize);
                    int lastPiece = (int) ((fileOffset + fileSize - 1) / pieceSize);
                    int totalPieces = lastPiece - firstPiece + 1;

                    // Count downloaded pieces for this file
                    int downloadedPieces = 0;
                    try {
                        com.frostwire.jlibtorrent.PieceIndexBitfield pieces = torrent.getTorrentHandle().status().pieces();
                        if (pieces != null) {
                            for (int i = firstPiece; i <= lastPiece; i++) {
                                if (pieces.getBit(i)) {
                                    downloadedPieces++;
                                }
                            }
                            // Calculate file-specific progress
                            fileProgress = totalPieces > 0 ? (float) downloadedPieces / totalPieces : 0;
                        }
                    } catch (Exception pieceException) {
                        // Pieces not ready yet, fall back to overall progress
                        fileProgress = status.progress;
                    }
                }
            } catch (Exception e) {
                // Fall back to overall progress on error
                fileProgress = status.progress;
            }
        }

        params.putString("progress", "" + fileProgress);
        params.putString("seeds", "" + status.seeds);
        this.command.sendEvent(this.magnetUrl, "status", params);
    }

    @Override
    public void onStreamStopped() {
        WritableMap params = Arguments.createMap();
        params.putString("magnetUrl", "" + this.magnetUrl);
        params.putString("msg", "OnStreamStoped");
        this.command.sendEvent(this.magnetUrl, "stop", params);
    }
}