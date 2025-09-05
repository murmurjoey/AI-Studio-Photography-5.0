import React, { useRef, useState, useCallback } from 'react';
import type { UploadedImage } from '../types';

interface ImageUploaderProps {
  title: string;
  onImageUpload: (image: UploadedImage | null) => void;
  imagePreviewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onImageUpload, imagePreviewUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
     if (!file.type.startsWith('image/')) {
        setError('請上傳有效的圖片文件。');
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const [header, base64Data] = dataUrl.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
        onImageUpload({
          base64: base64Data,
          mimeType,
          previewUrl: dataUrl,
        });
      };
      reader.onerror = () => {
        setError('讀取文件失敗。');
      };
      reader.readAsDataURL(file);
  }, [onImageUpload]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };


  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);


  return (
    <div className="bg-slate-900/50 rounded-lg h-full flex flex-col p-2">
      <div
        className={`relative flex-grow w-full rounded-md flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out group overflow-hidden border-2 border-dashed ${isDragging ? 'border-purple-500 bg-slate-800' : 'border-slate-700'}`}
        onClick={handleContainerClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        {imagePreviewUrl ? (
          <>
            <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm font-semibold">{title}</p>
            </div>
          </>
        ) : (
          <div className="text-slate-500 flex flex-col items-center p-4 text-center transition-colors duration-300 group-hover:text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="font-semibold text-lg">{title}</span>
            <span className="text-base mt-1">點擊或拖曳圖片</span>
            <span className="text-xs text-slate-600 mt-2">支援格式: JPG, PNG, WEBP</span>
          </div>
        )}
      </div>
       {error && <p className="text-red-400 mt-1 text-center text-xs">{error}</p>}
    </div>
  );
};

export default ImageUploader;