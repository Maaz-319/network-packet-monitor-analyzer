# NTMA - Network Traffic Monitor & Analyzer

Lightweight network traffic monitor with a FastAPI backend and a static HTML/CSS/JavaScript frontend. It supports two views of packet data:

- Static capture, backed by seeded sample data in `backend/data/db.json`
- Live capture, streamed from packet sniffing through Scapy

The UI shows a packet table, filter controls, a packet detail panel, and summary statistics for total packets, protocol counts, and average packet size.

## Project layout

```text
backend/
├── api
│   ├── __init__.py
│   └── routes.py
├── core
│   ├── __init__.py
│   ├── live_capture.py
│   ├── seed.py
│   └── static_capture.py
├── data
│   ├── db.json
│   └── live_db.json
├── main.py
├── model
│   ├── __init__.py
│   └── packet_parse.py
└── requirements.txt

frontend/
├── index.html
├── script.js
└── styles.css
```

### Requirements

- Python 3.10 or newer
- `pip`
- Scapy-compatible packet capture permissions for live mode on your OS

On Linux, live capture usually requires root privileges.

### Install dependencies

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run the backend API

```bash
cd backend
source .venv/bin/activate
python main.py
# or
python3 main.py
```

The API exposes these routes:

- `GET /` - health check
- `GET /static` - return sample packets
- `GET /start` - start live sniffing in the background
- `GET /stop` - stop live sniffing
- `GET /live?offset=0` - fetch live packets starting at an offset

### Open the frontend

Open `frontend/index.html` directly in your browser after the backend is running.

In the UI:

- Click **Start** in static mode to load sample packets from the backend
- Click **Switch to Live Capture** to use the live packet stream
- Click **Start** again in live mode to begin sniffing and loading live packets
- Click **Stop** to stop live capture

## Example packet shape

Backend packet objects follow this shape:

```json
{
  "Time": 1.33,
  "Source": "192.168.1.1",
  "Destination": "192.168.1.2",
  "Protocol": "TCP",
  "Length": 100,
  "Src_Port": 12345,
  "Dst_Port": 80,
  "Size": 100
}
```

The table in the frontend shows only `Time`, `Source`, `Destination`, and `Protocol`. The detail panel shows the full packet record.