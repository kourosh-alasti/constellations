"use client";

import React, { useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export const WebcamCapture = () => {
  const webcamRef = useRef<Webcam>(null);

  const captureAndSend = useCallback(async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        console.log("Captured Image:", imageSrc);

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
        } catch (error) {
          console.error("Upload error:", error);
        }
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      captureAndSend();
    }, 2000);

    return () => clearInterval(interval);
  }, [captureAndSend]);

  return (
    <div>
      <Webcam
        className="rounded-lg"
        audio={false}
        height={720}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={1280}
        videoConstraints={videoConstraints}
      />
    </div>
  );
};

export default WebcamCapture;
