"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Save, X, Navigation } from "lucide-react";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AddressEditModalProps {
  initialAddress: string;
  initialLat?: number;
  initialLng?: number;
  onSave: (address: string, lat: number, lng: number) => void;
  onClose: () => void;
}

export default function AddressEditModal({
  initialAddress,
  initialLat,
  initialLng,
  onSave,
  onClose,
}: AddressEditModalProps) {
  const [address, setAddress] = useState(initialAddress || "");
  const [position, setPosition] = useState<[number, number]>([
    initialLat || 11.9404, // Default to Dalat
    initialLng || 108.4583,
  ]);

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
      },
    });

    return <Marker position={position} />;
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
      );
      const data = await res.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Cập nhật địa chỉ</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-secondary rounded-full transition-colors"
            aria-label="Đóng"
          >
            <X className="size-6 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Address Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Địa chỉ</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-secondary border-input text-foreground p-4 rounded-2xl min-h-[80px] focus:ring-1 focus:ring-primary/50 outline-none transition-all"
              placeholder="Nhập địa chỉ của bạn..."
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGetCurrentLocation}
              variant="outline"
              className="w-full h-12 rounded-xl border-input text-primary hover:bg-primary/10 flex gap-2 font-bold uppercase text-[13px]"
            >
              <Navigation className="size-4" /> Dùng vị trí hiện tại
            </Button>
            <Button
              onClick={() => onSave(address, position[0], position[1])}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex gap-2 font-bold uppercase text-[13px]"
            >
              <Save className="size-4" /> Lưu địa chỉ
            </Button>
          </div>

          {/* Coordinates Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary p-4 rounded-2xl border border-border">
              <div className="text-[11px] text-muted-foreground font-bold uppercase mb-1">Vĩ độ</div>
              <div className="text-foreground font-bold text-lg">{position[0].toFixed(7)}</div>
            </div>
            <div className="bg-secondary p-4 rounded-2xl border border-border">
              <div className="text-[11px] text-muted-foreground font-bold uppercase mb-1">Kinh độ</div>
              <div className="text-foreground font-bold text-lg">{position[1].toFixed(7)}</div>
            </div>
          </div>

          {/* Map Preview */}
          <div className="rounded-2xl overflow-hidden border border-border h-[220px] relative">
            <MapContainer
              center={position}
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
