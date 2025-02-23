import { useState, useCallback } from 'react';
import { MediaItem } from '@/app/types';
import { X, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { useMedia } from '@/app/contexts/MediaContext';

interface MediaSelectionStepProps {
  onCompleteAction: (mediaItems: MediaItem[]) => void;
}

export default function MediaSelectionStep({ onCompleteAction }: MediaSelectionStepProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const { storeMediaItems } = useMedia();

  // Handle media upload
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newMediaItems: MediaItem[] = files.map((file, index) => ({
      id: uuidv4(),
      type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
      url: URL.createObjectURL(file),
      displayOrder: mediaItems.length + index + 1,
      duration: file.type.startsWith('video/') ? undefined : 15,
    }));
    const updatedItems = [...mediaItems, ...newMediaItems];
    setMediaItems(updatedItems);
    storeMediaItems(updatedItems);
    onCompleteAction(updatedItems);
  }, [mediaItems, storeMediaItems, onCompleteAction]);

  // Handle media reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const newItems = [...mediaItems];
    const [removed] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, removed);
    setMediaItems(newItems);
    storeMediaItems(newItems);
    onCompleteAction(newItems);
  };

  return (
    <div className="animate-fade-in">
     
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">Media Sequence</h2>
          <p className="text-text-secondary mt-2">Drag and drop to reorder your media</p>
        </div>
        <div className="flex gap-4">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="media-upload"
          />
          <label
            htmlFor="media-upload"
            className="inline-flex items-center border border-[#2C2C2E] text-sm font-medium text-white bg-brand-primary hover:bg-brand-primary/90 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            +Add Media
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {mediaItems.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
            className="flex items-center p-4 bg-dark-surface backdrop-blur-sm rounded-lg border border-[#2C2C2E] hover:border-brand-primary/50 transition-all duration-200 group"
          >
            <div className="touch-none cursor-grab active:cursor-grabbing p-1 pr-2 text-text-tertiary group-hover:text-text-secondary">
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="relative w-16 h-16 mr-4 rounded-lg overflow-hidden bg-dark-surface">
              {item.type === 'VIDEO' ? (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={item.url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
            <div className="flex-1">
              <div className="text-text-primary font-medium">
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)} {index + 1}
              </div>
              <div className="text-text-secondary text-sm">
                Duration: {item.type === 'VIDEO' ? 'Full length' : '15 seconds'}
              </div>
            </div>
            <button
              onClick={() => {
                const updatedItems = mediaItems.filter((_, i) => i !== index);
                setMediaItems(updatedItems);
                storeMediaItems(updatedItems);
                onCompleteAction(updatedItems);
              }}
              className="ml-4 p-2 text-text-tertiary hover:text-status-error transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {mediaItems.length === 0 && (
        <div className="text-center py-12 bg-dark-surface backdrop-blur-sm rounded-lg border border-[#2C2C2E] ">
          <p className="text-text-primary text-lg">No media items added</p>
          <p className="text-text-secondary text-sm mt-2">Click +Add Media to get started</p>
        </div>
      )}
    </div>
  );
} 