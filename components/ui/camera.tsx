"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export const WebcamCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);

  const [faceDetected, setFaceDetected] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false); // ✅ NEW

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

  const captureAndSend = useCallback(async () => {
    // ✅ Only capture if we haven't uploaded yet
    if (webcamRef.current && faceDetectorRef.current && !hasUploaded) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        console.log("Captured Image:", imageSrc);

        const img = new Image();
        img.src = imageSrc;

        img.onload = async () => {
          const detections = await faceDetectorRef.current!.detect(img);

          console.log("Detections:", detections);

          if (detections.detections.length > 0) {
            console.log(`✅ ${detections.detections.length} face(s) detected!`);
            setFaceDetected(true);

            try {
              const res = await fetch("/api/upload-image", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ image: imageSrc }),
              });

              if (!res.ok) throw new Error("Failed to upload image");

              const data = await res.json();
              console.log("Server response:", data);

              // ✅ After first successful upload, stop further captures
              setHasUploaded(true);
            } catch (error) {
              console.error("Upload error:", error);
            }
          } else {
            console.log("❌ No face detected in the captured image.");
            setFaceDetected(false);
          }
        };
      }
    }
  }, [hasUploaded]);

  useEffect(() => {
    loadFaceDetector();
  }, [loadFaceDetector]);

  useEffect(() => {
    const interval = setInterval(() => {
      captureAndSend();
    }, 2000); // Every 2 seconds

    return () => clearInterval(interval);
  }, [captureAndSend]);

  return (
    <div className="relative flex flex-col items-center">
      <Webcam
        className="rounded-lg"
        audio={false}
        height={720}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={1280}
        videoConstraints={videoConstraints}
      />
      {faceDetected && (
        <div className="absolute top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-lg font-semibold animate-pulse">
          Face Detected!
        </div>
      )}
      {hasUploaded && (
        <div className="absolute top-20 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-lg font-semibold">
          Upload Complete!
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
