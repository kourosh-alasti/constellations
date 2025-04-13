from fastapi import FastAPI
from facenet_pytorch import InceptionResnetV1

from .db import create_db_and_tables
from .routes import node, edge

app = FastAPI(
    docs_url="/api/py/docs",
    openapi_url="/api/py/openapi.json"
)

app.include_router(node.router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # global model
    # model = InceptionResnetV1(pretrained='vggface2').eval()
    # app.state.facenet = model  # ✅ stored here!

@app.get('/')
def index(): return 'go to /api/py/docs'
