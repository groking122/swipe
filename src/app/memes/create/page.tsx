'use client';

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import useAuth from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProgressBar from '@/components/ui/ProgressBar';
import ImageCropper from '@/components/ui/ImageCropper';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

export default function CreateMemePage() {
  const router = useRouter();
  const auth = useAuth();
  const { showToast } = useToast();
  const isAuthenticated = auth.isAuthenticated;
  const user = auth.user;
  const isLoading = auth.loading;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state persistence
  const { state: formState, setState: setFormState, clearPersistedState } = useFormPersistence({
    key: 'meme-create-form',
    initialState: {
      title: '',
    },
  });
  
  // Image upload with optimization
  const {
    file: selectedFile,
    preview: previewUrl,
    originalPreview,
    compressedPreview,
    progress: compressionProgress,
    isCompressing,
    error: imageError,
    compressionStats,
    handleImageSelect,
    resetImage,
    togglePreview,
    isShowingOriginal
  } = useImageUpload({
    maxSizeMB: 1,
    maxWidthOrHeight: 1200, // Changed to 1200px as per requirements
  });
  
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  
  // Load title from persisted form state
  useEffect(() => {
    if (formState.title) {
      setTitle(formState.title);
    }
  }, [formState.title]);
  
  // Update persisted form state when title changes
  useEffect(() => {
    setFormState(prev => ({ ...prev, title }));
  }, [title, setFormState]);
  
  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.push('/sign-in');
    return null;
  }

  // Handle file selection
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      resetImage();
      return;
    }
    
    const file = files[0];
    setFileError(null);
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFileError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      showToast('Please select a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
      resetImage();
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size must be less than 5MB');
      showToast('File size must be less than 5MB', 'error');
      resetImage();
      return;
    }
    
    // Process the image with optimization
    await handleImageSelect(file);
  };
  
  // Handle cropped image
  const handleCrop = (croppedImageData: string) => {
    setCroppedPreview(croppedImageData);
    setShowCropper(false);
    
    // Convert data URL to File object
    fetch(croppedImageData)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], selectedFile?.name || 'cropped-image.jpg', {
          type: 'image/jpeg',
          lastModified: new Date().getTime()
        });
        handleImageSelect(file);
      })
      .catch(err => {
        console.error('Error creating file from cropped image:', err);
        showToast('Failed to process cropped image', 'error');
      });
  };

  // Handle title change
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Validate title length
    if (newTitle.length > 0 && newTitle.length < 5) {
      setTitleError('Title must be at least 5 characters');
    } else if (newTitle.length > 100) {
      setTitleError('Title must be less than 100 characters');
    } else {
      setTitleError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!title || title.length < 5) {
      setTitleError('Title must be at least 5 characters');
      showToast('Title must be at least 5 characters', 'error');
      return;
    }
    
    if (!selectedFile) {
      setFileError('Please select an image file');
      showToast('Please select an image file', 'error');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', selectedFile);
      
      // Upload to the server using the dedicated create endpoint with progress tracking
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      // Create a promise to handle the XHR request
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.open('POST', '/api/memes/create');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || errorData.message || 'Upload failed'));
            } catch (error) {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error occurred'));
        };
        
        xhr.send(formData);
      });
      
      // Wait for upload to complete
      const data = await uploadPromise;
      
      // Show success message
      showToast('Meme uploaded successfully!', 'success');
      
      // Clear persisted form state
      clearPersistedState();
      
      // Redirect to the memes page on success
      router.push('/memes');
      
    } catch (err) {
      console.error('Error uploading meme:', err);
      
      // Provide more specific error messages based on common issues
      if (err instanceof Error) {
        if (err.message.includes('storage') || err.message.includes('bucket') || err.message.includes('upload')) {
          const errorMsg = `Storage error: ${err.message}. Please try again later.`;
          setError(errorMsg);
          showToast(errorMsg, 'error');
        } else if (err.message.includes('limit')) {
          const errorMsg = `Upload limit reached: ${err.message}`;
          setError(errorMsg);
          showToast(errorMsg, 'error');
        } else {
          setError(err.message);
          showToast(err.message, 'error');
        }
      } else {
        const errorMsg = 'An unexpected error occurred. Please try again later.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Simulate file input change
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(e.dataTransfer.files[0]);
      
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        handleFileChange({ target: { files: dataTransfer.files } } as ChangeEvent<HTMLInputElement>);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Upload a Meme</h1>
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Create New Meme</h2>
          </CardHeader>
          
          {showCropper && previewUrl ? (
            <div className="p-4">
              <h3 className="text-lg font-medium mb-2">Crop Your Image</h3>
              <div className="h-64 mb-4">
                <ImageCropper
                  src={previewUrl}
                  onCrop={handleCrop}
                  aspectRatio={1}
                  className="h-full"
                />
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCropper(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent>
                {error && (
                  <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}
                
                <div className="mb-6">
                  <Input
                    label="Title"
                    id="title"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Enter a catchy title"
                    error={titleError || undefined}
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    {`${title.length}/100 characters`}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meme Image
                  </label>
                  
                  <div
                    className={`border-2 border-dashed rounded-md p-6 text-center ${
                      fileError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="meme-image"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    
                    {isCompressing && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Optimizing image...</p>
                        <ProgressBar progress={compressionProgress} showPercentage />
                      </div>
                    )}
                    
                    {!isCompressing && previewUrl ? (
                      <div className="mb-4">
                        <div className="relative h-48 w-full mb-2">
                          <Image
                            src={croppedPreview || previewUrl}
                            alt="Preview"
                            fill
                            className="object-contain"
                          />
                          {isShowingOriginal && (
                            <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded-bl">
                              Original
                            </div>
                          )}
                          {!isShowingOriginal && !croppedPreview && (
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl">
                              Optimized
                            </div>
                          )}
                        </div>
                        
                        {compressionStats && !croppedPreview && (
                          <div className="text-xs text-gray-500 mb-2 text-center">
                            <p>Original: {compressionStats.originalSize.toFixed(1)} KB → Compressed: {compressionStats.compressedSize.toFixed(1)} KB</p>
                            <p>Saved {compressionStats.compressionRatio.toFixed(1)}% of original size</p>
                          </div>
                        )}
                        
                        <div className="flex space-x-2 justify-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              resetImage();
                              setCroppedPreview(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                          >
                            Remove
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setShowCropper(true)}
                          >
                            Crop
                          </Button>
                          {originalPreview && compressedPreview && !croppedPreview && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={togglePreview}
                            >
                              {isShowingOriginal ? 'Show Optimized' : 'Show Original'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      !isCompressing && (
                        <div
                          className="flex flex-col items-center justify-center cursor-pointer py-6"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <svg
                            className="w-12 h-12 text-gray-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-gray-500 mb-1">Drag and drop your image here, or click to browse</p>
                          <p className="text-xs text-gray-400">JPEG, PNG, GIF, WebP up to 5MB</p>
                          <p className="text-xs text-gray-400 mt-1">Images will be automatically optimized (80% quality, max 1200px)</p>
                        </div>
                      )
                    )}
                  </div>
                  
                  {fileError && (
                    <p className="mt-1 text-sm text-red-600">{fileError}</p>
                  )}
                  
                  {imageError && (
                    <p className="mt-1 text-sm text-red-600">{imageError}</p>
                  )}
                </div>
                
                {isSubmitting && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Uploading meme...</p>
                    <ProgressBar progress={uploadProgress} showPercentage />
                  </div>
                )}
              </CardContent>
              
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      clearPersistedState();
                      router.back();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !!titleError || !!fileError || !selectedFile || isCompressing}
                    isLoading={isSubmitting}
                  >
                    Upload Meme
                  </Button>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
} 