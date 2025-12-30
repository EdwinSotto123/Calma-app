import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';

interface ImageGalleryProps {
  images: Array<{
    id: string;
    url: string;
    caption?: string;
    senderName?: string;
    type?: 'image' | 'audio' | 'photo';
  }>;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!isOpen || images.length === 0) return null;

  const current = images[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoom();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoom();
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in' && scale < 3) {
      setScale((prev) => Math.min(prev + 0.5, 3));
    } else if (direction === 'out' && scale > 1) {
      setScale((prev) => Math.max(prev - 0.5, 1));
    }
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(current.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calma-memory-${current.id}.jpg`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Calma - Recuerdo',
          text: current.caption || current.senderName || 'Un recuerdo especial',
          url: current.url,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy URL
      navigator.clipboard.writeText(current.url);
      alert('Link copiado al portapapeles');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors"
        aria-label="Cerrar galería"
      >
        <X size={24} className="text-white" />
      </button>

      {/* Image Container */}
      <div className="relative w-full h-[60vh] flex items-center justify-center mb-4">
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <img
            src={current.url}
            alt={current.caption || 'Recuerdo'}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            }}
          />
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors text-white"
              aria-label="Imagen anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2 rounded-full transition-colors text-white"
              aria-label="Siguiente imagen"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      {/* Metadata */}
      {(current.caption || current.senderName) && (
        <div className="w-full max-w-2xl mb-4 px-4 text-white text-center">
          {current.senderName && (
            <p className="text-sm text-white/70 mb-1">De: {current.senderName}</p>
          )}
          {current.caption && (
            <p className="text-base leading-relaxed">{current.caption}</p>
          )}
        </div>
      )}

      {/* Counter */}
      <div className="text-white text-sm mb-4">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap justify-center">
        {scale > 1 && (
          <button
            onClick={() => handleZoom('out')}
            className="bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium"
          >
            Alejar
          </button>
        )}
        {scale < 3 && (
          <button
            onClick={() => handleZoom('in')}
            className="bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium"
          >
            Acercar
          </button>
        )}
        {scale !== 1 && (
          <button
            onClick={resetZoom}
            className="bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium"
          >
            Resetear
          </button>
        )}
        <button
          onClick={handleDownload}
          className="bg-teal-500/80 hover:bg-teal-600 text-white px-4 py-2 rounded-full transition-colors flex items-center gap-2 text-sm font-medium"
          aria-label="Descargar"
        >
          <Download size={16} />
          Descargar
        </button>
        <button
          onClick={handleShare}
          className="bg-blue-500/80 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-colors flex items-center gap-2 text-sm font-medium"
          aria-label="Compartir"
        >
          <Share2 size={16} />
          Compartir
        </button>
      </div>
    </div>
  );
};

export default ImageGallery;
