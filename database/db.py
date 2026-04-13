"""
Database module for Smart Surveillance System.
Provides logging to both SQLite (local) and MongoDB (optional).
"""

import sqlite3
import os
from datetime import datetime

# ---------------------------------------------------------------------------
# SQLite Setup
# ---------------------------------------------------------------------------

DB_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_PATH = os.path.join(DB_DIR, "detections.db")


def _get_sqlite_connection():
    """Return a connection to the SQLite database."""
    conn = sqlite3.connect(SQLITE_PATH)
    return conn


def init_sqlite():
    """Create the detections table if it doesn't exist."""
    conn = _get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS detections (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            object    TEXT    NOT NULL,
            confidence REAL   NOT NULL,
            timestamp TEXT    NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    print(f"[DB] SQLite initialized at {SQLITE_PATH}")


def save_to_sqlite(data: dict):
    """
    Save a single detection record to SQLite.
    data = {"object": str, "confidence": float, "timestamp": str}
    """
    conn = _get_sqlite_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO detections (object, confidence, timestamp) VALUES (?, ?, ?)",
        (data["object"], data["confidence"], data["timestamp"]),
    )
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# MongoDB Setup (optional — silently skips if unavailable)
# ---------------------------------------------------------------------------

_mongo_collection = None


def init_mongodb():
    """
    Try to connect to a local MongoDB instance.
    If MongoDB is not running, this silently disables Mongo logging.
    """
    global _mongo_collection
    try:
        from pymongo import MongoClient

        client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
        # Force a connection test
        client.server_info()
        db = client["smart_surveillance"]
        _mongo_collection = db["detections"]
        print("[DB] MongoDB connected → smart_surveillance.detections")
    except Exception as e:
        _mongo_collection = None
        print(f"[DB] MongoDB not available ({e}). Skipping Mongo logging.")


def save_to_mongodb(data: dict):
    """
    Save a single detection record to MongoDB (if connected).
    data = {"object": str, "confidence": float, "timestamp": str}
    """
    if _mongo_collection is None:
        return
    try:
        _mongo_collection.insert_one(data.copy())
    except Exception:
        pass  # Silently skip if Mongo errors out


# ---------------------------------------------------------------------------
# Convenience: save to both databases
# ---------------------------------------------------------------------------

def save_detection(object_name: str, confidence: float):
    """
    Save a detection record to both SQLite and MongoDB.
    Automatically adds a timestamp.
    """
    record = {
        "object": object_name,
        "confidence": round(confidence, 4),
        "timestamp": datetime.now().isoformat(),
    }
    save_to_sqlite(record)
    save_to_mongodb(record)


# ---------------------------------------------------------------------------
# Initialize databases on import
# ---------------------------------------------------------------------------

init_sqlite()
init_mongodb()
