package com.ghondar.torrentstreamer;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Arguments;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import java.util.Map;
import java.util.HashMap;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.github.se_bastiaan.torrentstream.StreamStatus;
import com.github.se_bastiaan.torrentstream.Torrent;
import com.github.se_bastiaan.torrentstream.TorrentOptions;
import com.github.se_bastiaan.torrentstream.TorrentStream;
import com.github.se_bastiaan.torrentstream.listeners.TorrentListener;

public class TorrentStreamerModule extends ReactContextBaseJavaModule implements ICommand {
    private final ReactApplicationContext reactContext;
    private Map<String, TorrentItem> torrents = new HashMap<String, TorrentItem>();

    public TorrentStreamerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "TorrentStreamer";
    }

    @ReactMethod
    public void createTorrent(String magnetUrl, String location, Boolean removeAfterStop) {
        if (this.torrents.containsKey(magnetUrl))
            return;
        TorrentItem torrent = new TorrentItem(magnetUrl, location, removeAfterStop, this, this.reactContext);
        this.torrents.put(magnetUrl, torrent);
    }

    @ReactMethod
    public void start(String magnetUrl) {
        TorrentItem torrent = this.torrents.get(magnetUrl);
        if (torrent != null)
            torrent.start();
    }

    @ReactMethod
    public void stop(String magnetUrl) {
        TorrentItem torrent = this.torrents.get(magnetUrl);
        if (torrent != null)
            torrent.stop();

        destroy(magnetUrl);
    }

    @ReactMethod
    public void destroy(String magnetUrl) {
        this.torrents.remove(magnetUrl);
    }

    @ReactMethod
    public void setSelectedFileIndex(String magnetUrl, Integer selectedFileIndex) {
        TorrentItem torrent = this.torrents.get(magnetUrl);
        if (torrent != null)
            torrent.setSelectedFileIndex(selectedFileIndex);
    }

    public void sendEvent(String magnetUrl, String eventName, @Nullable WritableMap params) {
        eventName = eventName + magnetUrl;
        this.reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
    }

    @ReactMethod
    public void open(String url, String type) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(Uri.parse(url), type);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        // Check that an app exists to receive the intent
        if (intent.resolveActivity(this.reactContext.getPackageManager()) != null) {
            this.reactContext.startActivity(intent);
        }
    }

}
