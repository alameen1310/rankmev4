import { useRef } from 'react';
import { Camera, Image, Video, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Paperclip } from 'lucide-react';

interface MediaPickerProps {
  onSelectImage: (file: File) => void;
  onSelectVideo: (file: File) => void;
  onOpenCamera?: () => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export function MediaPicker({
  onSelectImage,
  onSelectVideo,
  onOpenCamera,
  isUploading,
  disabled,
}: MediaPickerProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectImage(file);
    }
    e.target.value = '';
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check video size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert('Video must be under 50MB');
        return;
      }
      onSelectVideo(file);
    }
    e.target.value = '';
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        onSelectVideo(file);
      } else {
        onSelectImage(file);
      }
    }
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          side="top" 
          align="start" 
          className="w-auto p-2 z-[70]"
          sideOffset={8}
        >
          <div className="flex flex-col gap-1">
            {/* Camera */}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="w-4 h-4 text-primary" />
              <span>Camera</span>
            </Button>

            {/* Photo Gallery */}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() => imageInputRef.current?.click()}
            >
              <Image className="w-4 h-4 text-green-500" />
              <span>Photo</span>
            </Button>

            {/* Video Gallery */}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() => videoInputRef.current?.click()}
            >
              <Video className="w-4 h-4 text-purple-500" />
              <span>Video</span>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
