'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import imageCompression from 'browser-image-compression';

export default function MemeUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<number | null>(null);

  // Handle file selection
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.');
      setFile(null);
      setPreview(null);
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      setError('File too large. Maximum size is 5MB.');
      setFile(null);
      setPreview(null);
      return;
    }

    try {
      setCompressionProgress(0);
      
      // Compression options
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: selectedFile.type,
        onProgress: (progress: number) => {
          setCompressionProgress(Math.round(progress * 100));
        },
      };

      // Compress the image
      const compressedFile = await imageCompression(selectedFile, options);
      
      setFile(compressedFile);
      setError(null);
      setCompressionProgress(null);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      setError('Failed to process image. Please try again.');
      setFile(null);
      setPreview(null);
      setCompressionProgress(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !file) {
      setError('Title and file are required.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);

      const response = await fetch('/api/memes/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Navigate to the newly created meme
      router.push(`/memes/${data.meme.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to upload meme');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <Input
        label="Title"
        id="title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter a title for your meme"
        required
      />
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Upload Image
        </label>
        <div 
          className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
            preview ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
          }`}
        >
          {compressionProgress !== null ? (
            <div className="text-center py-8">
              <div className="mb-2">Processing image: {compressionProgress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${compressionProgress}%` }}
                ></div>
              </div>
            </div>
          ) : preview ? (
            <div className="space-y-2 text-center">
              <div className="overflow-hidden rounded-md max-h-64 w-auto">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="h-auto w-full object-contain"
                />
              </div>
              <p className="text-xs text-gray-500">
                Image size: {file ? (file.size / 1024).toFixed(1) + " KB" : "Unknown"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileChange}
                    required
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 5MB (will be compressed)
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full"
          isLoading={isUploading || compressionProgress !== null}
          disabled={isUploading || !title || !file || compressionProgress !== null}
        >
          {isUploading ? 'Uploading...' : compressionProgress !== null ? 'Processing...' : 'Upload Meme'}
        </Button>
      </div>
    </form>
  );
} 