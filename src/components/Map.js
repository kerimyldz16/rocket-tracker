import React, { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl"; // Mapbox kütüphanesi
import axios from "axios"; // API istekleri için Axios
import "mapbox-gl/dist/mapbox-gl.css"; // Mapbox CSS
import DataTable from "./DataTable"; // Veri Tablosu bileşeni

const Map = () => {
  const mapContainerRef = useRef(null); // Harita konteyner referansı
  const mapRef = useRef(null); // Mapbox harita referansı
  const [currentIndex, setCurrentIndex] = useState(0); // Şu anki veri indexi
  const [totalLocations, setTotalLocations] = useState(0); // Toplam veri sayısı
  const intervalRef = useRef(null); // Interval ID'yi saklamak için
  const [currentLocation, setCurrentLocation] = useState(null); // Şu anki lokasyon bilgisi

  mapboxgl.accessToken = process.env.REACT_APP_MAP_API_KEY; // Mapbox API anahtarı

  // Harita oluşturma işlemi
  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current, // Harita konteyneri
      style: "mapbox://styles/mapbox/satellite-streets-v11", // Harita stili
      center: [29.012, 41.002], // Başlangıç merkezi koordinatları
      zoom: 10, // Başlangıç zoom seviyesi
    });

    // Harita temizleme işlemi
    return () => mapRef.current.remove();
  }, []);

  // Toplam kayıt sayısını çekme
  useEffect(() => {
    const fetchTotalLocations = async () => {
      try {
        // Veritabanından toplam kayıt sayısını çek
        const countResponse = await axios.get(
          "http://localhost:5000/locations/count"
        );
        setTotalLocations(countResponse.data.count); // Toplam kayıt sayısını state'e kaydet
      } catch (error) {
        console.error("Toplam lokasyon verisi alınamadı:", error);
      }
    };

    fetchTotalLocations(); // İlk yüklemede toplam kayıt sayısını getir
  }, []);

  // Belirli bir lokasyonu çek ve haritada göster
  useEffect(() => {
    const fetchLocation = async (index) => {
      const startTime = performance.now(); // Veri çekme işlem başlangıcı
      try {
        // Veritabanından index'e göre lokasyon çek
        const response = await axios.get(
          `http://localhost:5000/locations/${index}`
        );
        const location = response.data; // Gelen veriyi al

        const endTime = performance.now(); // Veri çekme işlem bitişi
        const delay = (endTime - startTime).toFixed(2); // Gecikme süresini hesapla

        updateMap(location); // Haritayı güncelle
        setCurrentLocation({ ...location, delay: `${delay} ms` }); // Lokasyonu gecikme hızıyla kaydet
      } catch (error) {
        console.error("Lokasyon verisi alınamadı:", error);
      }
    };

    const updateMap = (location) => {
      const { latitude, longitude } = location;

      // Eski kaynak ve katmanları kaldır
      if (mapRef.current.getLayer("single-point")) {
        mapRef.current.removeLayer("single-point");
      }
      if (mapRef.current.getSource("single-point")) {
        mapRef.current.removeSource("single-point");
      }

      // Yeni kaynak ekle
      mapRef.current.addSource("single-point", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
      });

      // Yeni katman ekle
      mapRef.current.addLayer({
        id: "single-point",
        type: "circle",
        source: "single-point",
        paint: {
          "circle-radius": 10,
          "circle-color": "#ff0000",
          "circle-opacity": 0.7,
        },
      });

      // Yanıp sönme efekti
      let opacity = 0.7;
      const blinkInterval = setInterval(() => {
        opacity = opacity === 0.7 ? 0.3 : 0.7; // Opaklık değişimi
        mapRef.current.setPaintProperty(
          "single-point",
          "circle-opacity",
          opacity
        );
      }, 500);

      // Efekti 10 saniye sonra durdur
      setTimeout(() => {
        clearInterval(blinkInterval);
        mapRef.current.setPaintProperty("single-point", "circle-opacity", 0.7);
      }, 3000);
    };

    const startLoop = () => {
      // Belirli aralıklarla sıradaki veriyi çek
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex + 1 < totalLocations ? prevIndex + 1 : 0
        );
      }, 3000);
    };

    if (totalLocations > 0) {
      fetchLocation(currentIndex); // İlk veriyi çek ve göster
      startLoop(); // Döngüyü başlat
    }

    // Temizlik
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [totalLocations, currentIndex]); // Bağımlılık dizisi sabit

  // Kullanıcının mevcut konumunu haritada göster
  useEffect(() => {
    const showUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLatitude = position.coords.latitude;
            const userLongitude = position.coords.longitude;

            // Harita yüklendikten sonra kullanıcı konumunu ekle
            mapRef.current.on("load", () => {
              // Eski kaynak ve katmanları kaldır
              if (mapRef.current.getLayer("user-location")) {
                mapRef.current.removeLayer("user-location");
              }
              if (mapRef.current.getSource("user-location")) {
                mapRef.current.removeSource("user-location");
              }

              // Kullanıcı konumu için kaynak ekle
              mapRef.current.addSource("user-location", {
                type: "geojson",
                data: {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [userLongitude, userLatitude],
                  },
                },
              });

              // Kullanıcı konumu için katman ekle
              mapRef.current.addLayer({
                id: "user-location",
                type: "circle",
                source: "user-location",
                paint: {
                  "circle-radius": 10,
                  "circle-color": "#0000ff", // Mavi renk
                  "circle-opacity": 0.8,
                },
              });
            });
          },
          (error) => {
            console.error("Kullanıcı konumu alınamadı:", error);
          }
        );
      } else {
        console.error("Geolocation API desteklenmiyor.");
      }
    };

    showUserLocation(); // Kullanıcı konumunu göster
  }, []);

  // Haritayı ortala
  const centerMap = () => {
    if (currentLocation) {
      const { latitude, longitude } = currentLocation;
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 16,
        speed: 1.2,
        curve: 1.5,
      });
    }
  };

  // Google Maps'te Yol Tarifi Al
  const getDirections = () => {
    if (currentLocation) {
      const { latitude, longitude } = currentLocation;
      // Kullanıcının mevcut konumunu al
      navigator.geolocation.getCurrentPosition((position) => {
        const userLatitude = position.coords.latitude; // Kullanıcının enlemi
        const userLongitude = position.coords.longitude; // Kullanıcının boylamı

        // Google maps yönlendirme bağlantısı oluştur.
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLatitude},${userLongitude}&destination=${latitude},${longitude}&travelmode=driving`;
        window.open(googleMapsUrl, "_blank"); // Yeni sekmede bağlantıyı aç
      });
    } else {
      alert("Hedef konum bulunamadı."); // Lokasyon bilgisi yoksa uyarı göster
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Harita konteyneri */}
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "104vh",
        }}
      />
      {/* Veri Tablosu Bileşeni */}
      <DataTable currentLocation={currentLocation} />
      {/* Ortala Butonu */}
      <button
        onClick={centerMap}
        style={{
          position: "absolute",
          textAlign: "center",
          top: "1rem",
          right: "11rem",
          padding: "10px 15px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        Ortala
      </button>
      {/* Yol Tarifi Butonu */}
      <button
        onClick={getDirections}
        style={{
          position: "absolute",
          textAlign: "center",
          top: "1rem",
          right: "5rem",
          padding: "10px 15px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        Yol Tarifi
      </button>
    </div>
  );
};

export default Map;
