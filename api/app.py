from fastapi import FastAPI

from .db import create_db_and_tables
from .routes import node, edge

### Create FastAPI instance with custom docs and openapi url
app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

app.include_router(node.router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get('/')
def index(): return 'go to /api/py/docs'
