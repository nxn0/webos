
import React, { useState, useEffect } from 'react';
import { Sun, Cloud, Wind, Droplets, MapPin, Loader2 } from 'lucide-react';

export const WeatherApp = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Default to New York if geolocation fails or isn't used
    const fetchWeather = async (lat: number, lon: number, city: string) => {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`);
            const json = await res.json();
            setData({ ...json, city });
            setLoading(false);
        } catch (e) {
            console.error(e);
            setError(true);
            setLoading(false);
        }
    }

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeather(position.coords.latitude, position.coords.longitude, "Local Weather");
            },
            () => {
                fetchWeather(40.71, -74.01, "New York (Default)");
            }
        );
    } else {
        fetchWeather(40.71, -74.01, "New York");
    }
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center text-white"><Loader2 className="animate-spin text-neutral-400" size={48}/></div>;
  if (error || !data) return <div className="h-full flex items-center justify-center text-neutral-500">Weather Unavailable</div>;

  const current = data.current_weather;
  const isDay = current.is_day === 1;

  return (
    <div className={`h-full p-6 text-neutral-200 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000 ${isDay ? 'bg-gradient-to-b from-blue-500/10 to-blue-300/5' : 'bg-gradient-to-b from-indigo-900/20 to-purple-800/10'}`}>
      
      <div className="absolute top-[-50px] right-[-50px] opacity-10"><Sun size={200} /></div>
      
      <div className="z-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2 opacity-60 text-neutral-400">
            <MapPin size={16} />
            <span className="uppercase tracking-wider text-sm font-bold">{data.city}</span>
        </div>
        
        <div className="flex flex-col items-center my-6">
            {isDay ? <Sun size={84} className="mb-4 text-yellow-200/80 animate-pulse-slow" /> : <Cloud size={84} className="mb-4 text-neutral-300/80" />}
            <h2 className="text-6xl font-black tracking-tighter text-white drop-shadow-sm">{current.temperature}°C</h2>
            <p className="text-xl font-medium mt-2 capitalize text-neutral-300">{isDay ? 'Sunny' : 'Clear Night'}</p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-6 w-full max-w-xs bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-sm">
            <div className="flex flex-col items-center">
                <Wind size={20} className="mb-1 text-neutral-400"/>
                <p className="font-bold text-neutral-200">{current.windspeed}</p>
                <p className="text-xs text-neutral-500">km/h</p>
            </div>
            <div className="flex flex-col items-center">
                <Droplets size={20} className="mb-1 text-neutral-400"/>
                <p className="font-bold text-neutral-200">45%</p>
                <p className="text-xs text-neutral-500">Hum</p>
            </div>
            <div className="flex flex-col items-center">
                <Sun size={20} className="mb-1 text-neutral-400"/>
                <p className="font-bold text-neutral-200">High</p>
                <p className="text-xs text-neutral-500">UV</p>
            </div>
        </div>
      </div>
    </div>
  );
};
