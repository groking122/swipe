'use client';

import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Meme } from '@/types';

interface MemeCardProps {
  meme: Meme;
  className?: string;
}

const MemeCard: React.FC<MemeCardProps> = ({ meme, className = '' }) => {
  return (
    <Card className={`overflow-hidden max-w-md w-full mx-auto ${className}`}>
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">{meme.title}</h2>
        {meme.creator && (
          <div className="text-sm text-gray-500">
            Posted by {meme.creator.username}
          </div>
        )}
      </div>
      
      <div className="relative aspect-square bg-gray-100">
        {/* Use Next.js Image for optimized loading */}
        <img
          src={meme.imagePath}
          alt={meme.title}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
      
      <div className="p-4 border-t bg-white">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {new Date(meme.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MemeCard; 