'use client';

import { useCallback, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { cn, generateId } from '@/lib/utils';
import type { ImageItem } from '@/types';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

export function ImageUploader() {
  const { images, addImage, removeImage } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setProcessing(true);
      try {
        const fileArray = Array.from(files).filter((f) =>
          f.type.startsWith('image/')
        );
        await Promise.all(
          fileArray.map(async (file) => {
            const id = generateId();
            const url = URL.createObjectURL(file);
            let base64 = '';
            try {
              base64 = await fileToBase64(file);
            } catch (err) {
              console.warn('Failed to read base64 for', file.name, err);
            }
            const imageItem: ImageItem = { id, url, file, base64 };
            addImage(imageItem);
          })
        );
      } finally {
        setProcessing(false);
      }
    },
    [addImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      e.target.value = '';
    },
    [handleFiles]
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Images
      </p>

      <div
        className={cn(
          'dropzone-mini',
          isDragging && 'border-primary-400 bg-primary-50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
          id="image-upload"
          disabled={processing}
        />
        <label htmlFor="image-upload" className="cursor-pointer block">
          <div className="flex flex-col items-center gap-1 py-2">
            {processing ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-gray-400" />
            )}
            <p className="text-xs text-gray-500">
              {processing ? 'Reading…' : 'Drop or click to upload'}
            </p>
          </div>
        </label>
      </div>

      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Uploaded"
                className="w-14 h-14 object-cover rounded-md border border-gray-200"
              />
              <button
                onClick={() => removeImage(image.id)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5" />
              </button>
              {!image.base64 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center rounded-b-md py-0.5">
                  Loading…
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
