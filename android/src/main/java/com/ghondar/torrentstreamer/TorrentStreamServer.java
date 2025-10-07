package com.ghondar.torrentstreamer;

import android.util.Log;

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Lightweight HTTP server for streaming video files
 * Supports HTTP Range requests for video seeking
 * No external dependencies - uses only Java standard library
 */
public class TorrentStreamServer {
    private static final String TAG = "TorrentStreamServer";
    private static final int BUFFER_SIZE = 8192;

    private ServerSocket serverSocket;
    private ExecutorService executorService;
    private AtomicBoolean isRunning = new AtomicBoolean(false);
    private File videoFile;
    private int port;

    public TorrentStreamServer(int port) throws IOException {
        this.port = port;
        // Port 0 means auto-assign
        this.serverSocket = new ServerSocket(port);
        this.port = serverSocket.getLocalPort();
        this.executorService = Executors.newFixedThreadPool(4);
        start();
    }

    public void setVideoFile(File file) {
        this.videoFile = file;
    }

    private void start() {
        isRunning.set(true);
        executorService.execute(new Runnable() {
            @Override
            public void run() {
                serverLoop();
            }
        });
        Log.d(TAG, "HTTP server started on port: " + port);
    }

    private void serverLoop() {
        while (isRunning.get()) {
            try {
                final Socket clientSocket = serverSocket.accept();
                executorService.execute(new Runnable() {
                    @Override
                    public void run() {
                        handleClient(clientSocket);
                    }
                });
            } catch (IOException e) {
                if (isRunning.get()) {
                    Log.e(TAG, "Error accepting client connection", e);
                }
            }
        }
    }

    private void handleClient(Socket socket) {
        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            OutputStream output = new BufferedOutputStream(socket.getOutputStream());

            // Parse HTTP request
            String requestLine = reader.readLine();
            if (requestLine == null || !requestLine.startsWith("GET")) {
                sendError(output, 400, "Bad Request");
                return;
            }

            // Parse headers
            String rangeHeader = null;
            String line;
            while ((line = reader.readLine()) != null && !line.isEmpty()) {
                if (line.toLowerCase().startsWith("range:")) {
                    rangeHeader = line.substring(6).trim();
                }
            }

            // Check if video file is set
            if (videoFile == null || !videoFile.exists()) {
                sendError(output, 404, "File not found");
                return;
            }

            // Handle range request or full file request
            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                handleRangeRequest(output, rangeHeader);
            } else {
                handleFullRequest(output);
            }

            output.flush();
        } catch (Exception e) {
            Log.e(TAG, "Error handling client request", e);
        } finally {
            try {
                socket.close();
            } catch (IOException e) {
                Log.e(TAG, "Error closing socket", e);
            }
        }
    }

    private void handleRangeRequest(OutputStream output, String rangeHeader) throws IOException {
        long fileSize = videoFile.length();
        String rangeValue = rangeHeader.substring("bytes=".length());

        long start = 0;
        long end = fileSize - 1;

        try {
            if (rangeValue.startsWith("-")) {
                // Last N bytes
                start = fileSize - Long.parseLong(rangeValue.substring(1));
            } else {
                String[] parts = rangeValue.split("-");
                start = Long.parseLong(parts[0]);
                if (parts.length > 1 && !parts[1].isEmpty()) {
                    end = Long.parseLong(parts[1]);
                }
            }
        } catch (NumberFormatException e) {
            sendError(output, 416, "Range Not Satisfiable");
            return;
        }

        // Validate range
        if (start < 0 || start > end || end >= fileSize) {
            sendError(output, 416, "Range Not Satisfiable");
            return;
        }

        long contentLength = end - start + 1;

        // Send HTTP 206 Partial Content response
        StringBuilder response = new StringBuilder();
        response.append("HTTP/1.1 206 Partial Content\r\n");
        response.append("Content-Type: ").append(getMimeType()).append("\r\n");
        response.append("Content-Length: ").append(contentLength).append("\r\n");
        response.append("Content-Range: bytes ").append(start).append("-").append(end).append("/").append(fileSize).append("\r\n");
        response.append("Accept-Ranges: bytes\r\n");
        response.append("Connection: close\r\n");
        response.append("\r\n");

        output.write(response.toString().getBytes());

        // Stream the requested range
        streamFileRange(output, start, end);
    }

    private void handleFullRequest(OutputStream output) throws IOException {
        long fileSize = videoFile.length();

        // Send HTTP 200 OK response
        StringBuilder response = new StringBuilder();
        response.append("HTTP/1.1 200 OK\r\n");
        response.append("Content-Type: ").append(getMimeType()).append("\r\n");
        response.append("Content-Length: ").append(fileSize).append("\r\n");
        response.append("Accept-Ranges: bytes\r\n");
        response.append("Connection: close\r\n");
        response.append("\r\n");

        output.write(response.toString().getBytes());

        // Stream the entire file
        streamFileRange(output, 0, fileSize - 1);
    }

    private void streamFileRange(OutputStream output, long start, long end) throws IOException {
        FileInputStream fis = new FileInputStream(videoFile);
        try {
            // Skip to start position
            long skipped = 0;
            while (skipped < start) {
                long skip = fis.skip(start - skipped);
                if (skip <= 0) break;
                skipped += skip;
            }

            // Stream the content
            byte[] buffer = new byte[BUFFER_SIZE];
            long remaining = end - start + 1;

            while (remaining > 0) {
                int toRead = (int) Math.min(buffer.length, remaining);
                int bytesRead = fis.read(buffer, 0, toRead);
                if (bytesRead == -1) break;

                output.write(buffer, 0, bytesRead);
                remaining -= bytesRead;
            }
        } finally {
            fis.close();
        }
    }

    private void sendError(OutputStream output, int statusCode, String message) throws IOException {
        StringBuilder response = new StringBuilder();
        response.append("HTTP/1.1 ").append(statusCode).append(" ").append(message).append("\r\n");
        response.append("Content-Type: text/plain\r\n");
        response.append("Content-Length: ").append(message.length()).append("\r\n");
        response.append("Connection: close\r\n");
        response.append("\r\n");
        response.append(message);

        output.write(response.toString().getBytes());
    }

    private String getMimeType() {
        if (videoFile == null) return "video/mp4";

        String fileName = videoFile.getName().toLowerCase();
        if (fileName.endsWith(".mp4")) {
            return "video/mp4";
        } else if (fileName.endsWith(".mkv")) {
            return "video/x-matroska";
        } else if (fileName.endsWith(".avi")) {
            return "video/x-msvideo";
        } else if (fileName.endsWith(".webm")) {
            return "video/webm";
        } else if (fileName.endsWith(".m4v")) {
            return "video/x-m4v";
        } else if (fileName.endsWith(".mov")) {
            return "video/quicktime";
        } else if (fileName.endsWith(".flv")) {
            return "video/x-flv";
        }
        return "video/mp4"; // default
    }

    public void stop() {
        isRunning.set(false);
        try {
            if (serverSocket != null && !serverSocket.isClosed()) {
                serverSocket.close();
            }
        } catch (IOException e) {
            Log.e(TAG, "Error closing server socket", e);
        }

        if (executorService != null) {
            executorService.shutdownNow();
        }
        Log.d(TAG, "HTTP server stopped");
    }

    public String getServerUrl() {
        return "http://127.0.0.1:" + port + "/stream";
    }

    public int getListeningPort() {
        return port;
    }
}
