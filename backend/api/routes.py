from fastapi import APIRouter
import threading

from core.static_capture import static_packets
from core.live_capture import start_sniffing, stop_sniffing, captured_data

sniffer_thread = None

router = APIRouter()

@router.get("/")
def read_root():
    return {"success": True}

@router.get("/static")
def read_static():
    return static_packets()

@router.get("/start")
def start():
    global sniffer_thread

    if sniffer_thread and sniffer_thread.is_alive():
        return {"message": "Capture already running"}
    
    sniffer_thread = threading.Thread(target=start_sniffing, daemon=True)
    sniffer_thread.start()

    return {"message": "Capture started"}

@router.get("/stop")
def stop():
    stop_sniffing()
    return {"message": "Capture stopped"}

@router.get("/live")
def live(offset: int = 0):
    return {
        "data": captured_data[offset:],
        "next_offset": len(captured_data)
    }