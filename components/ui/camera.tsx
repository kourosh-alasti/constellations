"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

interface WebcamCaptureProps {
  onPhotoCaptured: (image: string) => void;
}

// video constraints
const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export const WebcamCapture = ({ onPhotoCaptured }: WebcamCaptureProps) => {
  const webcamRef = useRef<Webcam>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);

  const [faceDetected, setFaceDetected] = useState(false);

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

  // capture and detect faces
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

            // pass the captured image to parent
            onPhotoCaptured(imageSrc);
          } else {
            console.log("❌ No face detected.");
          }
        };
      }
    }
  }, [faceDetected, onPhotoCaptured]);

  useEffect(() => {
    loadFaceDetector();
  }, [loadFaceDetector]);

  useEffect(() => {
    const interval = setInterval(() => {
      captureAndSend();
    }, 2000);

    return () => clearInterval(interval);
  }, [captureAndSend]);

  return (
    <div className="relative w-full max-w-4xl overflow-hidden rounded-md border-2 border-gray-700 shadow-md bg-gray-800">
      {/* webcam feed */}
      <Webcam
        className="rounded-md w-full"
        audio={false}
        height={720}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={1280}
        videoConstraints={videoConstraints}
      />

      {/* detection banner */}
      {faceDetected && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600/90 backdrop-blur-md px-6 py-2 rounded-md text-white font-bold text-lg animate-pulse shadow-lg">
          face detected
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
