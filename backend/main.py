from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import boto3
from datetime import datetime
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Database setup ─────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/photosclone")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# ─── Photo model (database table) ───────────────────────
class Photo(Base):
    __tablename__ = "photos"

    id        = Column(Integer, primary_key=True, index=True)
    filename  = Column(String)
    size      = Column(Integer)
    bucket    = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ─── MinIO setup ────────────────────────────────────────
s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("MINIO_URL", "http://localhost:9000"),
    aws_access_key_id=os.getenv("MINIO_USER", "minioadmin"),
    aws_secret_access_key=os.getenv("MINIO_PASSWORD", "minioadmin"),
)

BUCKET = "photos"

def ensure_bucket():
    existing = [b["Name"] for b in s3.list_buckets()["Buckets"]]
    if BUCKET not in existing:
        s3.create_bucket(Bucket=BUCKET)

ensure_bucket()

# ─── Routes ─────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "PhotosClone API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/photos/upload")
def upload_photo(file: UploadFile = File(...)):
    db = SessionLocal()

    s3.upload_fileobj(file.file, BUCKET, file.filename)

    photo = Photo(
        filename=file.filename,
        size=file.size,
        bucket=BUCKET,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    db.close()

    return {"id": photo.id, "filename": photo.filename, "message": "Uploaded successfully"}

@app.get("/photos")
def list_photos():
    db = SessionLocal()
    photos = db.query(Photo).all()
    db.close()

    return [
        {
            "id": p.id,
            "filename": p.filename,
            "size": p.size,
            "uploaded_at": p.uploaded_at,
        }
        for p in photos
    ]