import { useEffect, useState } from "react";
import { Card, Spin, Alert } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useWidgetContext } from "./WidgetContext";

export default function LocationFetcher() {
  const { widgetData, setWidgetData } = useWidgetContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLocation = () => {
    setLoading(true);
    setError(null);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          fetchCityName(newLocation.latitude, newLocation.longitude);
          fetchWeather(newLocation.latitude, newLocation.longitude);
        },
        () => {
          setError("Failed to get location. Please enable location services.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  };

  const fetchCityName = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      if (data?.address) {
        setWidgetData((prev) => ({
          ...prev,
          city: data.address.city || data.address.town || data.address.village || "Unknown Location",
        }));
      }
    } catch (err) {
      console.error("Failed to fetch city name:", err);
    }
  };

  const fetchWeather = async (lat, lon) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      const data = await response.json();
      if (data.current_weather) {
        setWidgetData((prev) => ({
          ...prev,
          weather: {
            temperature: data.current_weather.temperature,
          },
        }));
      }
    } catch (err) {
      setError("Failed to fetch weather data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return (
    <Card title="Location & Weather" style={{ width: "100%", textAlign: "center" }}>
      {loading ? (
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      ) : (
        <>
          <p><strong>City:</strong> {widgetData.city || "Fetching..."}</p>
          {widgetData.weather ? (
            <p><strong>Temperature:</strong> {widgetData.weather.temperature}°C</p>
          ) : (
            <p>Loading weather...</p>
          )}
        </>
      )}

      {error && <Alert message={error} type="error" showIcon />}
    </Card>
  );
}
