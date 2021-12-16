package com.ghondar.torrentstreamer;

import com.facebook.react.bridge.WritableMap;
import androidx.annotation.Nullable;


public interface ICommand {
    public void sendEvent(String magnetUrl, String eventName, @Nullable WritableMap params);
}