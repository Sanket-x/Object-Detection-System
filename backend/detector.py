import sys
import os
import time
import cv2
import torch
from ultralytics import YOLO

# Add project root to path so we can import the database module
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from database.db import save_detection


# ---------------------------------------------------------------------------
# Global stats dictionary — updated every frame by generate_frames()
# ---------------------------------------------------------------------------

latest_stats = {
    "objects": 0,
    "confidence": 0.0,
    "fps": 0.0,
    "alerts": 0,
    "status": "Active",
    "classes": [],
}


# ---------------------------------------------------------------------------
# Model Loader
# ---------------------------------------------------------------------------

def load_model(model_path: str = "yolov8s.pt") -> YOLO:
    """
    Load and return the YOLOv8 model.
    Downloads the weights automatically on the first run.
    """
    print(f"Loading YOLO model: {model_path}")
    model = YOLO(model_path)
    
    # Evaluate device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    if device == "cuda":
        print("Using GPU")
    else:
        print("Using CPU")
        
    model.to(device)
    return model


# ---------------------------------------------------------------------------
# Frame Generator (used by FastAPI streaming endpoint)
# ---------------------------------------------------------------------------

# Throttle DB writes — save at most once per second to avoid flooding
_last_db_save_time = 0.0

# Camera control states
camera_active = True
latest_annotated_frame = None

def set_camera_active(state: bool):
    global camera_active
    camera_active = state
    return camera_active

def get_latest_frame():
    global latest_annotated_frame
    return latest_annotated_frame


def generate_frames(model: YOLO, camera_index: int = 0):
    """
    Generator that captures webcam frames, runs YOLO detection,
    and yields each annotated frame as JPEG bytes.

    Also updates `latest_stats` and logs detections to the database.
    """
    global latest_stats, _last_db_save_time, camera_active, latest_annotated_frame

    cap = cv2.VideoCapture(camera_index)

    if not cap.isOpened():
        print("Error: Could not open the webcam.")
        return

    print("--- Streaming Detection Started ---")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    prev_time = time.time()
    frame_count = 0

    try:
        while True:
            if not camera_active:
                if cap.isOpened():
                    cap.release()
                time.sleep(0.1)
                continue
            else:
                if not cap.isOpened():
                    cap = cv2.VideoCapture(camera_index)
                    time.sleep(0.5)

            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                continue

            # Resize frame
            frame = cv2.resize(frame, (640, 480))
            
            # Run YOLOv8 inference with optimizations (FP16 enabled for GPU)
            use_half = (device == "cuda")
            results = model.predict(frame, imgsz=640, conf=0.6, device=device, half=use_half, verbose=False)
            result = results[0]

            # ── Extract real detection data ──────────────
            boxes = result.boxes
            num_objects = len(boxes)
            confidences = boxes.conf.tolist() if num_objects > 0 else []
            class_ids = boxes.cls.tolist() if num_objects > 0 else []
            class_names = [result.names[int(c)] for c in class_ids]

            max_conf = round(max(confidences), 2) if confidences else 0.0
            has_person = "person" in class_names

            # ── Calculate FPS ────────────────────────────
            current_time = time.time()
            fps = 1.0 / (current_time - prev_time) if (current_time - prev_time) > 0 else 0.0
            prev_time = current_time

            # ── Update global stats ──────────────────────
            latest_stats = {
                "objects": num_objects,
                "confidence": max_conf,
                "fps": round(fps, 1),
                "alerts": 1 if has_person else 0,
                "status": "Active",
                "classes": list(set(class_names)),
            }

            # ── Save detections to DB (throttled: max 1/sec) ─
            if num_objects > 0 and (current_time - _last_db_save_time) >= 1.0:
                _last_db_save_time = current_time
                for name, conf in zip(class_names, confidences):
                    save_detection(name, conf)

            # Draw bounding boxes, labels, and confidence scores
            annotated_frame = result.plot(
                line_width=2,
                font_size=4,
                conf=True,
                labels=True,
            )

            latest_annotated_frame = annotated_frame.copy()

            # Encode frame as JPEG
            success, buffer = cv2.imencode(".jpg", annotated_frame)
            if not success:
                continue

            # Yield in multipart format for MJPEG streaming
            frame_bytes = buffer.tobytes()
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
    finally:
        cap.release()
        print("Webcam released.")


# ---------------------------------------------------------------------------
# Standalone mode — opens an OpenCV window (for quick local testing)
# ---------------------------------------------------------------------------

def start_detection():
    """
    Standalone function that opens an OpenCV window for local testing.
    Press 'q' to quit.
    """
    model = load_model()
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not open the webcam.")
        return

    print("\n--- Detection Started ---")
    print("Press 'q' in the video window to stop.")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Resize frame
        frame = cv2.resize(frame, (640, 480))
        
        # Run YOLOv8 inference with optimizations (FP16 enabled for GPU)
        use_half = (device == "cuda")
        results = model.predict(frame, imgsz=640, conf=0.6, device=device, half=use_half, verbose=False)
        annotated_frame = results[0].plot(line_width=2, font_size=4, conf=True, labels=True)

        cv2.imshow("Smart Surveillance - YOLOv8 Live Feed", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            print("Exiting detection loop...")
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Cleaned up resources successfully.")


if __name__ == "__main__":
    start_detection()
