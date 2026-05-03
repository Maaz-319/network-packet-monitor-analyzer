# **Network Packet Monitor & Analyzer (NTMA)**

Video demonstration: [YouTube Link](https://youtu.be/3g0HYzkaweA)

This tool demonstrates capturing, parsing, and visualizing network packets.

- Backend: FastAPI application (serves static sample data and controls live capture)
- Frontend: Single-file static UI (HTML/CSS/JS) that consumes the backend API
- Packet capture: Uses Scapy for live sniffing; seeded JSON for static/demo data

What this project does
----------------------

NTMA provides two ways to inspect packet-level network data:

- Static mode — returns a small seeded dataset stored at `backend/data/db.json`.
- Live mode — starts Scapy-based packet sniffing and sends packets to the frontend.

Directory structure
------------------------
```
network-packet-monitor-analyzer/
├── README.md
├── .gitignore
├── backend/
│   ├── main.py              
│   ├── requirements.txt
│   ├── api/
|   |   ├── __init__.py
│   │   └── routes.py        
│   ├── core/
|   |   ├── __init__.py
│   │   ├── live_capture.py  
│   │   ├── static_capture.py
│   │   └── seed.py          
│   ├── data/
│   │   └── db.json          
│   └── model/
|       ├── __init__.py
│       └── packet_parse.py 
└── frontend/
    ├── index.html           
    ├── style.css                
    └── script.js    
```            

Quick start
-----------

Prerequisites
- Python 3.8+ (3.10+ recommended)
- `pip`
- For live capture with Scapy: OS-level packet capture permissions (root/Administrator on many platforms)

Windows:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Linux (This project was developed on Ubuntu):

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the backend (development)

The backend is a FastAPI app. From `backend/`:

```bash
python main.py
```

Notes on permissions
- Live capture uses Scapy which may require elevated privileges to open raw sockets. On Linux, run the backend with `sudo` if necessary. On Windows, run the terminal as Administrator.

Backend API
-----------

Available endpoints (`backend/api/routes.py`):

- `GET /` — health check (returns {"success": true})
- `GET /static` — returns seeded packet list from `backend/data/db.json`
- `GET /start` — starts live sniffing in a background thread
- `GET /stop` — stops live sniffing
- `GET /live?offset=<n>` — returns live-captured packets starting at `offset`

Frontend usage
--------------

Open `frontend/index.html` in your browser while the backend is running. The UI supports two modes:

- Static: loads the seeded JSON from `backend/data/db.json` via `GET /static`.
- Live: sends `GET /start`, polls `GET /live?offset=...` and displays new packets.

UI controls
- Start / Stop — control capture and load packets
- Mode toggle — switch between static and live modes
- Filters — protocol, source IP, destination IP
- Save / Load — export or import a JSON packet file from the browser

File notes
---------------

- The backend entrypoint is `backend/main.py`.
- Core capture logic is in `backend/core/live_capture.py` and `backend/core/static_capture.py`.
- Sample data seeded by `backend/core/seed.py` and stored in `backend/data/db.json`.
- Simple parser helper in `backend/model/packet_parse.py`.

Dependencies
- `backend/requirements.txt` (FastAPI, Uvicorn, Scapy).

Files referenced
- Backend entry: [backend/main.py](backend/main.py)
- Seed data: [backend/data/db.json](backend/data/db.json)
- API routes: [backend/api/routes.py](backend/api/routes.py)
- Frontend: [frontend/index.html](frontend/index.html)