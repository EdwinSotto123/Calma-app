import { Cloud, CloudRain, Sun, CloudSnow, CloudLightning, Wind } from 'lucide-react';

export const getWeatherRecommendation = (code: number, temp: number) => {
  // WMO Weather interpretation codes (http://www.wmo.int/pages/prog/www/IMOP/publications/CIMO-Guide/Guide-2008/Part-I/Chapter-13.pdf)
  // 0: Clear sky
  // 1, 2, 3: Mainly clear, partly cloudy, and overcast
  // 45, 48: Fog
  // 51-55: Drizzle
  // 61-65: Rain
  // 71-77: Snow
  // 95-99: Thunderstorm

  if (code === 0 || code === 1) {
    return {
      text: "El cielo está despejado.",
      activity: "Perfecto para salir a caminar y sentir el sol.",
      icon: Sun,
      color: "text-amber-500",
      bg: "bg-amber-50 border-amber-100"
    };
  }
  
  if (code >= 2 && code <= 3) {
    return {
      text: "Hay algunas nubes.",
      activity: "Buen momento para respirar aire fresco fuera.",
      icon: Cloud,
      color: "text-slate-500",
      bg: "bg-slate-50 border-slate-100"
    };
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      text: "Está lloviendo.",
      activity: "Ideal para un té caliente y escuchar la lluvia.",
      icon: CloudRain,
      color: "text-blue-500",
      bg: "bg-blue-50 border-blue-100"
    };
  }

  if (code >= 71 && code <= 77) {
     return {
      text: "Hace frío afuera.",
      activity: "Mantente abrigado y lee algo reconfortante.",
      icon: CloudSnow,
      color: "text-cyan-500",
      bg: "bg-cyan-50 border-cyan-100"
    };
  }
  
  if (code >= 95) {
     return {
      text: "Hay tormenta.",
      activity: "Quédate en un lugar seguro y practica grounding.",
      icon: CloudLightning,
      color: "text-indigo-500",
      bg: "bg-indigo-50 border-indigo-100"
    };
  }

  // Default
  return {
      text: `Hacen ${temp}°C.`,
      activity: "Tómate un momento para conectar con tu entorno.",
      icon: Wind,
      color: "text-teal-500",
      bg: "bg-teal-50 border-teal-100"
  };
};

export const fetchWeatherData = async (lat: number, lon: number) => {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await response.json();
        return data.current_weather;
    } catch (error) {
        console.error("Error fetching weather", error);
        return null;
    }
};