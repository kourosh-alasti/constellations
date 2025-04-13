"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

interface WebcamCaptureProps {
  onPhotoCaptured: () => void; // function to call when a face is detected
}

// video constraints
const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export const WebcamCapture = ({ onPhotoCaptured }: WebcamCaptureProps) => {
  // refs
  const webcamRef = useRef<Webcam>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);

  // state
  const [faceDetected, setFaceDetected] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);

  // load face detector model
  const loadFaceDetector = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    const detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
        delegate: "GPU",
      },
      runningMode: "IMAGE",
    });

    faceDetectorRef.current = detector;
  }, []);

  // capture image and run face detection
  const captureAndSend = useCallback(async () => {
    if (webcamRef.current && faceDetectorRef.current && !faceDetected) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const img = new Image();
        img.src = imageSrc;

        img.onload = async () => {
          const detections = await faceDetectorRef.current!.detect(img);

          if (detections.detections.length > 0) {
            console.log(`✅ Face detected!`);
            setFaceDetected(true);

            onPhotoCaptured();

            // continue uploading image to server
            try {
              const res = await fetch("/api/upload-image", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ image: imageSrc }),
              });

              if (!res.ok) throw new Error("Failed to upload image");

              await res.json();
              setHasUploaded(true);
            } catch (error) {
              console.error("Upload error:", error);
            }
          } else {
            console.log("❌ No face detected.");
          }
        };
      }
    }
  }, [faceDetected, onPhotoCaptured]);

  // load face detector once on mount
  useEffect(() => {
    loadFaceDetector();
  }, [loadFaceDetector]);

  // scan for faces every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      captureAndSend();
    }, 2000);

    return () => clearInterval(interval);
  }, [captureAndSend]);

  return (
    <div className="relative w-full max-w-4xl overflow-hidden rounded-md border-2 border-gray-700 shadow-md bg-gray-800">
      {/* webcam */}
      <Webcam
        className="rounded-md w-full"
        audio={false}
        height={720}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={1280}
        videoConstraints={videoConstraints}
      />

      {/* banners */}
      {faceDetected && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600/90 backdrop-blur-md px-6 py-2 rounded-md text-white font-bold text-lg animate-pulse shadow-lg">
          face detected
        </div>
      )}

      {hasUploaded && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-blue-600/90 backdrop-blur-md px-6 py-2 rounded-md text-white font-bold text-lg shadow-lg">
          uploaded
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
