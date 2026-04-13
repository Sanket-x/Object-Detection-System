import sys
import os

# Add project root to path so we can import the database module
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
import time

from detector import load_model, generate_frames
import detector  # live reference to latest_stats

from database.db import _get_sqlite_connection

# ---------------------------------------------------------------------------
# App Initialization
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Smart Surveillance API",
    description="Real-time YOLOv8 object detection streamed over HTTP",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the React frontend to connect
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # In production, restrict to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load YOLO model once at startup
# ---------------------------------------------------------------------------

model = load_model("yolov8s.pt")

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/")
def root():
    """Health-check / welcome endpoint."""
    return {
        "status": "running",
        "message": "Smart Surveillance API is live 🚀",
    }


@app.get("/video_feed")
def video_feed():
    """
    Live MJPEG video stream with YOLOv8 detections.
    Open this URL in a browser or use an <img> tag in React.
    """
    return StreamingResponse(
        generate_frames(model),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@app.get("/stats")
def stats():
    """
    Return the latest detection statistics as JSON.
    Updated in real-time by the generate_frames() loop.
    """
    return detector.latest_stats


@app.post("/toggle_camera")
async def toggle_camera(request: Request):
    data = await request.json()
    state = data.get("active", True)
    detector.set_camera_active(state)
    return {"status": "success", "camera_active": state}


@app.get("/snapshot")
def take_snapshot():
    frame = detector.get_latest_frame()
    if frame is None:
        return JSONResponse(status_code=400, content={"error": "No frame available yet"})
    
    os.makedirs(os.path.join(PROJECT_ROOT, "backend", "snapshots"), exist_ok=True)
    filename = os.path.join(PROJECT_ROOT, "backend", "snapshots", f"snapshot_{int(time.time())}.jpg")
    import cv2
    cv2.imwrite(filename, frame)
    return FileResponse(filename, media_type="image/jpeg", filename=os.path.basename(filename))


@app.get("/history")
def history(limit: int = 50):
    """
    Alias for /logs to match frontend history route expectation.
    """
    return logs(limit=limit)


@app.get("/logs")
def logs(limit: int = 20):
    """
    Return the most recent detection logs from SQLite.
    ?limit=20 (default) controls how many rows to return.
    """
    conn = _get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, object, confidence, timestamp FROM detections ORDER BY id DESC LIMIT ?",
        (limit,),
    )
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row[0],
            "object": row[1],
            "confidence": row[2],
            "timestamp": row[3],
        }
        for row in rows
    ]
