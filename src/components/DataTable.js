import React, { useState } from "react";
import "../styles/DataTable.css";

const DataTable = ({ currentLocation }) => {
  const [menuOpen, setMenuOpen] = useState(false); // Menü açık/kapalı durumu

  return (
    <div className="data-table-wrapper">
      {/* Hamburger Menü Butonu */}
      <button
        className="hamburger-menu"
        onClick={() => setMenuOpen((prev) => !prev)} // Menü açık/kapalı durumunu değiştir
      >
        ☰
      </button>

      {/* Tablo: Menü Açıkken Göster */}
      {menuOpen && (
        <div className="data-table-container">
          <h2>Veri Tablosu</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Enlem</th>
                  <th>Boylam</th>
                  <th>Sürat (km/h)</th>
                  <th>Azami Hız (km/h)</th>
                  <th>Gecikme Hızı (ms)</th>
                  <th>İrtifa</th>
                </tr>
              </thead>
              <tbody>
                {currentLocation ? (
                  <tr>
                    <td>{currentLocation.latitude || "-"}</td>
                    <td>{currentLocation.longitude || "-"}</td>
                    <td>{currentLocation.speed || "-"}</td>
                    <td>{currentLocation.maxSpeed || "-"}</td>
                    <td>{currentLocation.delay || "-"}</td>
                    <td>{currentLocation.altitude || "-"}</td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan="6">Veri yükleniyor...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
