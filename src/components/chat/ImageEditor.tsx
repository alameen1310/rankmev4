import { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCw, FlipHorizontal, FlipVertical, Crop, Check, Undo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ImageEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageEditor({ file, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      drawImage(img);
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (originalImage) {
      drawImage(originalImage);
    }
  }, [rotation, flipX, flipY, brightness, contrast, originalImage]);

  const drawImage = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate size to fit container
    const containerWidth = container.clientWidth - 32;
    const containerHeight = container.clientHeight - 200;
    const maxWidth = Math.min(containerWidth, 500);
    const maxHeight = Math.min(containerHeight, 400);

    let { width, height } = img;
    
    // Swap dimensions for 90/270 degree rotations
    if (rotation === 90 || rotation === 270) {
      [width, height] = [height, width];
    }

    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    ctx.save();
    ctx.translate(scaledWidth / 2, scaledHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    
    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    const drawWidth = rotation === 90 || rotation === 270 ? scaledHeight : scaledWidth;
    const drawHeight = rotation === 90 || rotation === 270 ? scaledWidth : scaledHeight;
    
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }, [rotation, flipX, flipY, brightness, contrast]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlipX = () => {
    setFlipX((prev) => !prev);
  };

  const handleFlipY = () => {
    setFlipY((prev) => !prev);
  };

  const handleReset = () => {
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setBrightness(100);
    setContrast(100);
    setCropArea(null);
    setIsCropping(false);
  };

  const handleCropStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isCropping) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setCropStart({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  const handleCropMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!cropStart || !isCropping) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    setCropArea({
      x: Math.min(cropStart.x, currentX),
      y: Math.min(cropStart.y, currentY),
      width: Math.abs(currentX - cropStart.x),
      height: Math.abs(currentY - cropStart.y),
    });
  };

  const handleCropEnd = () => {
    setCropStart(null);
  };

  const applyCrop = () => {
    if (!cropArea || !canvasRef.current || !originalImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a new canvas with cropped area
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropArea.width;
    croppedCanvas.height = cropArea.height;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return;

    croppedCtx.drawImage(
      canvas,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );

    // Update main canvas
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    ctx.drawImage(croppedCanvas, 0, 0);

    setCropArea(null);
    setIsCropping(false);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsProcessing(true);
    
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
      });

      const editedFile = new File([blob], file.name, { type: 'image/jpeg' });
      onSave(editedFile);
    } catch (error) {
      console.error('Error saving image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b bg-card"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
        <span className="font-semibold">Edit Image</span>
        <Button 
          size="sm" 
          onClick={handleSave}
          disabled={isProcessing}
        >
          {isProcessing ? 'Saving...' : 'Send'}
          <Check className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 bg-black/90 overflow-hidden"
      >
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full rounded-lg"
            onMouseDown={handleCropStart}
            onMouseMove={handleCropMove}
            onMouseUp={handleCropEnd}
            onMouseLeave={handleCropEnd}
            onTouchStart={handleCropStart}
            onTouchMove={handleCropMove}
            onTouchEnd={handleCropEnd}
          />
          {/* Crop overlay */}
          {isCropping && cropArea && (
            <div
              className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.width,
                height: cropArea.height,
              }}
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div 
        className="bg-card border-t p-4 space-y-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={isCropping ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (isCropping && cropArea) {
                applyCrop();
              } else {
                setIsCropping(!isCropping);
                setCropArea(null);
              }
            }}
          >
            <Crop className="w-4 h-4 mr-1" />
            {isCropping ? (cropArea ? 'Apply' : 'Cancel') : 'Crop'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw className="w-4 h-4 mr-1" />
            Rotate
          </Button>
          <Button variant="outline" size="sm" onClick={handleFlipX}>
            <FlipHorizontal className="w-4 h-4 mr-1" />
            Flip H
          </Button>
          <Button variant="outline" size="sm" onClick={handleFlipY}>
            <FlipVertical className="w-4 h-4 mr-1" />
            Flip V
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <Undo className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>

        {/* Adjustments */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Brightness</span>
              <span className="text-muted-foreground">{brightness}%</span>
            </div>
            <Slider
              value={[brightness]}
              onValueChange={([v]) => setBrightness(v)}
              min={50}
              max={150}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Contrast</span>
              <span className="text-muted-foreground">{contrast}%</span>
            </div>
            <Slider
              value={[contrast]}
              onValueChange={([v]) => setContrast(v)}
              min={50}
              max={150}
              step={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
