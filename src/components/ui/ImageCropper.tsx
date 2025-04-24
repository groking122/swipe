'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface ImageCropperProps {
  src: string;
  onCrop: (croppedImageData: string) => void;
  aspectRatio?: number;
  className?: string;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  src,
  onCrop,
  aspectRatio = 1,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [cropArea, setCropArea] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const startPositionRef = useRef({ x: 0, y: 0 });
  
  // Initialize crop area when image loads
  useEffect(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      // Wait for image to load
      if (img.complete) {
        initializeCropArea();
      } else {
        img.onload = initializeCropArea;
      }
      
      function initializeCropArea() {
        const imgWidth = img.width;
        const imgHeight = img.height;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate initial crop area based on aspect ratio
        let width, height;
        
        if (imgWidth / imgHeight > aspectRatio) {
          // Image is wider than the target aspect ratio
          height = Math.min(imgHeight, containerHeight);
          width = height * aspectRatio;
        } else {
          // Image is taller than the target aspect ratio
          width = Math.min(imgWidth, containerWidth);
          height = width / aspectRatio;
        }
        
        // Center the crop area
        const x = (imgWidth - width) / 2;
        const y = (imgHeight - height) / 2;
        
        setCropArea({ x, y, width, height });
      }
    }
  }, [src, aspectRatio]);
  
  // Handle mouse/touch events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startPositionRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      startPositionRef.current = { x: touch.clientX, y: touch.clientY };
      setIsDragging(true);
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    updateCropPosition(e.clientX, e.clientY);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    updateCropPosition(touch.clientX, touch.clientY);
  };
  
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      generateCroppedImage();
    }
  };
  
  const updateCropPosition = (clientX: number, clientY: number) => {
    if (!imageRef.current || !containerRef.current) return;
    
    const img = imageRef.current;
    const container = containerRef.current;
    
    // Calculate the image's position and scale within the container
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calculate the movement delta
    const deltaX = clientX - startPositionRef.current.x;
    const deltaY = clientY - startPositionRef.current.y;
    
    // Update the start position for the next move
    startPositionRef.current = { x: clientX, y: clientY };
    
    // Calculate the scale factor between the displayed image and its natural size
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;
    
    // Update crop area position, keeping it within the image bounds
    setCropArea(prev => {
      const newX = Math.max(0, Math.min(img.naturalWidth - prev.width, prev.x + deltaX * scaleX));
      const newY = Math.max(0, Math.min(img.naturalHeight - prev.height, prev.y + deltaY * scaleY));
      
      return {
        ...prev,
        x: newX,
        y: newY,
      };
    });
  };
  
  const generateCroppedImage = () => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions to the crop area
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    
    // Draw the cropped portion of the image onto the canvas
    ctx.drawImage(
      img,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );
    
    // Convert canvas to data URL and pass to onCrop callback
    const croppedImageData = canvas.toDataURL('image/jpeg', 0.9);
    onCrop(croppedImageData);
  };
  
  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <img
        ref={imageRef}
        src={src}
        alt="Image to crop"
        className="max-w-full max-h-full"
        draggable={false}
      />
      
      <div
        className={`absolute border-2 border-white rounded-sm cursor-move ${isDragging ? 'opacity-70' : 'opacity-50'}`}
        style={{
          top: `${(cropArea.y / (imageRef.current?.naturalHeight || 1)) * 100}%`,
          left: `${(cropArea.x / (imageRef.current?.naturalWidth || 1)) * 100}%`,
          width: `${(cropArea.width / (imageRef.current?.naturalWidth || 1)) * 100}%`,
          height: `${(cropArea.height / (imageRef.current?.naturalHeight || 1)) * 100}%`,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      />
      
      <div className="absolute bottom-4 right-4">
        <button
          type="button"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          onClick={generateCroppedImage}
        >
          Apply Crop
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;