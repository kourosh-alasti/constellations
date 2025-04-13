import WebcamCapture from "@/components/ui/camera";
import { Label } from "@/components/ui/label";

export default function Camera() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="overflow-hidden rounded-lg border shadow-lg bg-stone-800 p-4">
        <WebcamCapture />
        <Label className="text-white">TAKING A PHOTO</Label>
      </div>
    </div>
  );
}
