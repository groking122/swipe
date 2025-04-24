'use client';

import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

interface UseImageUploadOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  onProgress?: (progress: number) => void;
}

interface UseImageUploadResult {
  file: File | null;
  preview: string | null;
  originalPreview: string | null;
  compressedPreview: string | null;
  progress: number;
  isCompressing: boolean;
  error: string | null;
  compressionStats: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null;
  handleImageSelect: (file: File) => Promise<void>;
  resetImage: () => void;
  togglePreview: () => void;
  isShowingOriginal: boolean;
}

const defaultOptions: UseImageUploadOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadResult {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null>(null);

  const mergedOptions = { ...defaultOptions, ...options };

  const handleImageSelect = useCallback(
    async (selectedFile: File) => {
      try {
        setError(null);
        setProgress(0);
        setIsCompressing(true);
        setCompressionStats(null);

        // Create original preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setOriginalPreview(reader.result as string);
          setPreview(reader.result as string); // Initially show original
        };
        reader.readAsDataURL(selectedFile);

        // Determine optimal format based on original image
        let targetFormat = 'jpeg'; // Default to JPEG
        if (selectedFile.type === 'image/png' && selectedFile.size < 1024 * 1024) {
          // Keep PNG for smaller images with transparency
          targetFormat = 'png';
        } else if (selectedFile.type === 'image/gif') {
          // Keep GIF format for animations
          targetFormat = 'gif';
        }

        // Compress image with quality setting
        const compressedFile = await imageCompression(selectedFile, {
          maxSizeMB: mergedOptions.maxSizeMB,
          maxWidthOrHeight: mergedOptions.maxWidthOrHeight || 1200, // Use 1200px as default
          useWebWorker: mergedOptions.useWebWorker,
          fileType: `image/${targetFormat}`,
          initialQuality: 0.8, // Set quality to 80%
          onProgress: (progress) => {
            const progressPercent = Math.round(progress * 100);
            setProgress(progressPercent);
            if (mergedOptions.onProgress) {
              mergedOptions.onProgress(progressPercent);
            }
          },
        });

        // Create compressed preview
        const compressedReader = new FileReader();
        compressedReader.onloadend = () => {
          setCompressedPreview(compressedReader.result as string);
          setPreview(compressedReader.result as string); // Show compressed version
        };
        compressedReader.readAsDataURL(compressedFile);

        // Create a new file with the original name but compressed content
        const optimizedFile = new File([compressedFile], selectedFile.name, {
          type: compressedFile.type,
          lastModified: new Date().getTime(),
        });

        // Calculate compression statistics
        const originalSizeKB = selectedFile.size / 1024;
        const compressedSizeKB = optimizedFile.size / 1024;
        const compressionRatio = (1 - (compressedSizeKB / originalSizeKB)) * 100;
        
        setCompressionStats({
          originalSize: originalSizeKB,
          compressedSize: compressedSizeKB,
          compressionRatio: compressionRatio
        });

        setFile(optimizedFile);
        setProgress(100);
      } catch (err) {
        console.error('Error compressing image:', err);
        setError(err instanceof Error ? err.message : 'Failed to process image');
        // Fall back to the original file if compression fails
        setFile(selectedFile);
      } finally {
        setIsCompressing(false);
      }
    },
    [mergedOptions]
  );

  const resetImage = useCallback(() => {
    setFile(null);
    setPreview(null);
    setOriginalPreview(null);
    setCompressedPreview(null);
    setProgress(0);
    setError(null);
    setCompressionStats(null);
  }, []);

  const togglePreview = useCallback(() => {
    if (preview === originalPreview) {
      setPreview(compressedPreview);
    } else {
      setPreview(originalPreview);
    }
  }, [preview, originalPreview, compressedPreview]);

  return {
    file,
    preview,
    originalPreview,
    compressedPreview,
    progress,
    isCompressing,
    error,
    compressionStats,
    handleImageSelect,
    resetImage,
    togglePreview,
    isShowingOriginal: preview === originalPreview
  };
}