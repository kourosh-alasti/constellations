from sqlmodel import SQLModel, Session, create_engine, text
from fastapi import Depends
from typing import Annotated
from models import *
from dotenv import load_dotenv
import os

load_dotenv()
CONNECTION_URL = os.getenv('POSTGRES_URL')
conn_url = f"{CONNECTION_URL}"  

# CONNECTION_URL = "constellations.db"
# conn_url = f"postgres:///{CONNECTION_URL}"  

def create_db_and_tables():  
    SQLModel.metadata.create_all(engine)
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()

engine = create_engine(conn_url, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

Conn = Annotated[Session, Depends(get_session)]
