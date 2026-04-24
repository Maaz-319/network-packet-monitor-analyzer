from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from core.seed import seed_database


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

if __name__ == "__main__":
    if "seed" in __import__("sys").argv:
        seed_database()
    elif "capture" in __import__("sys").argv:
        from core.live_capture import process_packet, start_capture
        start_capture()
    else:
        import uvicorn
        uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)