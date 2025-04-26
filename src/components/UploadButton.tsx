'use client'
import React, { useState, useRef } from 'react';
// Switch to the recommended SSR browser client
import { createBrowserClient } from '@supabase/ssr'; 
import { useAuth } from "@clerk/nextjs"; // Import Clerk hook
import { saveMemeData } from '../app/actions'; // Using relative path

export function UploadButton() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth(); // Get Clerk's getToken function

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null); // Clear previous errors
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // --- Get Clerk Token formatted for Supabase --- 
      console.log("[Client] Getting Clerk token for Supabase...");
      const token = await getToken({ template: "supabase" });
      if (!token) {
        throw new Error("User not authenticated or token unavailable.");
      }
      console.log("[Client] Obtained Supabase token from Clerk.");

      // --- Initialize Supabase client WITH the token --- 
      // NOTE: We create the client here to ensure it uses the latest token
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        // Pass the token globally for requests made by this instance
        // This might not be strictly necessary if @supabase/ssr handles it, 
        // but we are being explicit for debugging.
        {
          global: {
            headers: { Authorization: `Bearer ${token}` }
          }
        }
      );
      console.log("[Client] Supabase browser client created with token.");

      // --- Proceed with upload --- 
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      // Changed filePath: Upload directly to bucket root
      const filePath = fileName; 

      console.log(`[Client] Attempting storage upload to bucket 'meme-images' with path: ${filePath}`);

      const { data: storageData, error: storageError } = await supabase.storage
        .from('meme-images')
        .upload(filePath, selectedFile);

      // Log the raw storage error object if it exists
      if (storageError) {
        console.error("[Client] Raw Storage Upload Error Object:", JSON.stringify(storageError, null, 2)); 
        throw storageError; 
      }
      
      // Make sure path exists before proceeding
      if (!storageData?.path) {
          console.error("[Client] Storage upload succeeded but path is missing:", storageData);
          throw new Error("Storage upload failed: Path not returned.");
      }

      console.log("[Client] Storage upload successful, path:", storageData.path);

      // --- Call Server Action --- 
      const result = await saveMemeData(storageData.path); 
      console.log("[Client] Server Action result:", result);

      if (result?.error) {
         throw new Error(result.error);
      }

      alert('Meme uploaded successfully!');
      setSelectedFile(null); // Clear selection
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }

    } catch (err: any) {
      // Log the raw caught error object
      console.error('[Client] Raw error caught in catch block:', JSON.stringify(err, null, 2));
      // Use err.message if available, otherwise provide a generic error
      const errorMessage = err?.message ?? 'An unknown error occurred during upload.'; 
      setError(errorMessage);
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger hidden file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Hidden File Input */} 
      <input 
        type="file"
        accept="image/png, image/jpeg, image/gif, image/webp" // Accept common image types
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }} 
      />

      {/* Button to trigger file input */} 
      <button 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        onClick={triggerFileInput}
        disabled={isUploading}
      >
        {selectedFile ? `Selected: ${selectedFile.name.substring(0, 20)}...` : 'Choose Meme Image'}
      </button>

      {/* Upload Button (visible only if file selected) */} 
      {selectedFile && (
        <button 
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleUpload}
          disabled={isUploading || !selectedFile}
        >
          {isUploading ? 'Uploading...' : 'Upload Meme'}
        </button>
      )}

      {error && <p className="text-red-500 text-sm mt-2">Error: {error}</p>}
    </div>
  );
}