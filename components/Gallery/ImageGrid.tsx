import React, { useState } from 'react';
import { Play, Music, Image as ImageIcon } from 'lucide-react';

interface ImageGridProps {
  items: Array<{
    id: string;
    url: string;
    caption?: string;
    senderName?: string;
    type?: 'image' | 'audio' | 'photo';
  }>;
  onImageClick: (index: number) => void;
  columns?: number;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  items,
  onImageClick,
  columns = 3,
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageIcon size={48} className="text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">No hay imágenes aún</p>
        <p className="text-slate-400 text-sm">Los mensajes de amor con fotos aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map((item, index) => (
        <div
          key={item.id}
          onClick={() => onImageClick(index)}
          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-slate-100 animate-fade-in"
        >
          {/* Image */}
          <img
            src={item.url}
            alt={item.caption || item.senderName || 'Recuerdo'}
            onLoad={() => handleImageLoad(item.id)}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
              loadedImages.has(item.id) ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            {item.type === 'audio' ? (
              <div className="bg-white/90 p-3 rounded-full shadow-lg">
                <Play size={24} className="text-slate-800 fill-slate-800" />
              </div>
            ) : item.type === 'image' || item.type === 'photo' ? (
              <div className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Ver
              </div>
            ) : null}
          </div>

          {/* Badges */}
          {item.senderName && (
            <div className="absolute top-1 left-1 bg-gradient-to-r from-teal-500/80 to-emerald-500/80 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm truncate max-w-[calc(100%-8px)]">
              {item.senderName}
            </div>
          )}

          {item.type === 'audio' && (
            <div className="absolute bottom-1 right-1 bg-rose-500/80 p-1.5 rounded-full shadow-sm">
              <Music size={12} className="text-white" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImageGrid;
