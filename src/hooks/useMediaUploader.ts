import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'audio';
}

interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  duration?: number;
  width?: number;
  height?: number;
}

export function useMediaUploader(userId: string | undefined) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ loaded: 0, total: 0, percentage: 0 });
  const [error, setError] = useState<string | null>(null);

  const generateUniqueFileName = (originalName: string): string => {
    const extension = originalName.split('.').pop() || '';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomId}.${extension}`;
  };

  const compressImage = async (file: File, maxWidth = 1080): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Only compress if larger than maxWidth
        if (img.width <= maxWidth) {
          resolve(file);
          return;
        }

        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const getMediaDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
          URL.revokeObjectURL(img.src);
        };
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          resolve({ width: video.videoWidth, height: video.videoHeight });
          URL.revokeObjectURL(video.src);
        };
        video.onerror = () => resolve({ width: 0, height: 0 });
        video.src = URL.createObjectURL(file);
      } else {
        resolve({ width: 0, height: 0 });
      }
    });
  };

  const getMediaDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        const element = file.type.startsWith('video/') 
          ? document.createElement('video')
          : document.createElement('audio');
        
        element.onloadedmetadata = () => {
          resolve(Math.round(element.duration));
          URL.revokeObjectURL(element.src);
        };
        element.onerror = () => resolve(0);
        element.src = URL.createObjectURL(file);
      } else {
        resolve(0);
      }
    });
  };

  const uploadMedia = useCallback(async (
    file: File,
    type: 'image' | 'video' | 'audio'
  ): Promise<UploadResult | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      let fileToUpload = file;

      // Compress images
      if (type === 'image' && file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file);
      }

      // Get metadata
      const [dimensions, duration] = await Promise.all([
        getMediaDimensions(fileToUpload),
        getMediaDuration(fileToUpload),
      ]);

      // Generate path: userId/timestamp-randomId.ext
      const fileName = generateUniqueFileName(fileToUpload.name);
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      setProgress({ loaded: file.size, total: file.size, percentage: 100 });

      return {
        url: urlData.publicUrl,
        fileName: fileToUpload.name,
        fileSize: fileToUpload.size,
        duration: duration || undefined,
        width: dimensions.width || undefined,
        height: dimensions.height || undefined,
      };
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [userId]);

  const uploadVoiceNote = useCallback(async (
    blob: Blob,
    duration: number
  ): Promise<UploadResult | null> => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }

    const file = new File([blob], `voice-${Date.now()}.webm`, {
      type: blob.type || 'audio/webm',
    });

    setIsUploading(true);
    setError(null);

    try {
      const fileName = generateUniqueFileName(file.name);
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        duration,
      };
    } catch (err) {
      console.error('Voice upload error:', err);
      setError(err instanceof Error ? err.message : 'Voice upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [userId]);

  return {
    isUploading,
    progress,
    error,
    uploadMedia,
    uploadVoiceNote,
  };
}
