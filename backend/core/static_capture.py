import os
import json

DB_FILE = "db.json"
from core.seed import seed_database

def _get_data():
    try:
        with open(os.path.join(os.path.dirname(__file__), "../data", DB_FILE), "r") as f:
            return json.load(f)
    except FileNotFoundError:
        seed_database()
        return _get_data()

def static_packets():
    return _get_data()