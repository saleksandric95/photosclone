import React, { useState, useEffect } from "react"

const API = "http://localhost:8000"

export default function App() {
  const [photos, setPhotos]   = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchPhotos()
  }, [])

  function fetchPhotos() {
    fetch(`${API}/photos`)
      .then(res => res.json())
      .then(data => setPhotos(data))
  }

  function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    setUploading(true)

    fetch(`${API}/photos/upload`, {
      method: "POST",
      body: formData,
    })
      .then(res => res.json())
      .then(() => {
        fetchPhotos()
        setUploading(false)
      })
  }

  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <h1 style={styles.title}>PhotosClone</h1>
        <label style={styles.uploadBtn}>
          {uploading ? "Uploading..." : "Upload Photo"}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: "none" }}
          />
        </label>
      </div>

      <div style={styles.grid}>
        {photos.length === 0 && (
          <p style={styles.empty}>No photos yet. Upload your first one!</p>
        )}
        {photos.map(photo => (
          <div key={photo.id} style={styles.card}>
            <div style={styles.cardIcon}>🖼️</div>
            <p style={styles.cardName}>{photo.filename}</p>
            <p style={styles.cardMeta}>
              {(photo.size / 1024).toFixed(1)} KB
            </p>
            <p style={styles.cardMeta}>
              {new Date(photo.uploaded_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

    </div>
  )
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "32px 16px",
    fontFamily: "sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0,
  },
  uploadBtn: {
    background: "#2563eb",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center",
  },
  cardIcon: {
    fontSize: "48px",
    marginBottom: "8px",
  },
  cardName: {
    fontSize: "13px",
    fontWeight: "500",
    margin: "4px 0",
    wordBreak: "break-all",
  },
  cardMeta: {
    fontSize: "12px",
    color: "#6b7280",
    margin: "2px 0",
  },
  empty: {
    color: "#6b7280",
    gridColumn: "1 / -1",
    textAlign: "center",
    marginTop: "64px",
  },
}