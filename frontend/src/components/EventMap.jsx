import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { X, MapPin, Navigation, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom animated marker icon
const customIcon = new L.divIcon({
    className: 'custom-map-marker',
    html: `<div class="marker-pin"></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -45],
});

// Component to fly to a location when it changes
const FlyToLocation = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15, { duration: 1.5 });
        }
    }, [position, map]);
    return null;
};

const EventMap = ({ event, onClose }) => {
    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!event?.location) {
            setError('No location specified for this event');
            setLoading(false);
            return;
        }

        // Use OpenStreetMap Nominatim for geocoding
        const geocode = async () => {
            try {
                setLoading(true);
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(event.location)}&limit=1`,
                    { headers: { 'Accept': 'application/json' } }
                );
                const data = await res.json();
                if (data && data.length > 0) {
                    setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                } else {
                    setError(`Could not find location: "${event.location}"`);
                }
            } catch (err) {
                setError('Failed to load map. Check your connection.');
            }
            setLoading(false);
        };

        geocode();
    }, [event]);

    const openInGoogleMaps = () => {
        if (position) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${position[0]},${position[1]}`, '_blank');
        } else if (event?.location) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"></div>
            
            {/* Modal */}
            <div 
                className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-scale-in z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 dark:text-white">{event?.title}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Navigation className="w-3 h-3" /> {event?.location}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={openInGoogleMaps}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" /> Google Maps
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Map Container */}
                <div className="h-[450px] relative">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
                            <div className="text-center">
                                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Finding location...</p>
                            </div>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
                            <div className="text-center px-8">
                                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="w-8 h-8 text-red-400" />
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 font-medium">{error}</p>
                                <button 
                                    onClick={openInGoogleMaps}
                                    className="mt-4 px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                                >
                                    Try Google Maps instead
                                </button>
                            </div>
                        </div>
                    )}

                    {position && !loading && (
                        <MapContainer
                            center={position}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={position} icon={customIcon}>
                                <Popup>
                                    <div className="text-center">
                                        <strong>{event?.title}</strong><br />
                                        <span className="text-gray-500">{event?.location}</span><br />
                                        <span className="text-xs text-gray-400">{event?.date} at {event?.time}</span>
                                    </div>
                                </Popup>
                            </Marker>
                            <FlyToLocation position={position} />
                        </MapContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventMap;
