// src/features/driver/components/map/MapControls.tsx

import React from 'react';
import { FaPlus, FaMinus, FaExpand, FaCompress, FaCrosshairs, FaLocationArrow } from 'react-icons/fa';
import { useMap } from 'react-leaflet';

interface MapControlsProps {
  following: boolean;
  onRecenter: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({ following, onRecenter }) => {
  const map = useMap();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const zoomIn = () => map.zoomIn();
  const zoomOut = () => map.zoomOut();
  const toggleFullscreen = () => {
    const container = map.getContainer();
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 16);
      });
    }
  };

  const btnClass = "w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-xl active:scale-95 transition-all duration-150";

  return (
    <div className="absolute right-4 bottom-24 flex flex-col gap-2 z-[1000]">
      <button onClick={zoomIn} className={btnClass}><FaPlus size={14} /></button>
      <button onClick={zoomOut} className={btnClass}><FaMinus size={14} /></button>
      <button onClick={onRecenter} className={`${btnClass} ${following ? 'text-[#12B2E4]' : 'text-gray-400'}`}><FaCrosshairs size={14} /></button>
      <button onClick={getLocation} className={btnClass}><FaLocationArrow size={14} /></button>
      <button onClick={toggleFullscreen} className={btnClass}>{isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}</button>
    </div>
  );
};