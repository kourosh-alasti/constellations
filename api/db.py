from sqlmodel import SQLModel, Session, create_engine
from fastapi import Depends
from typing import Annotated

CONNECTION_URL = "constellations.db"

sqlite_file_name = "database.db"  
sqlite_url = f"sqlite:///{CONNECTION_URL}"  

def create_db_and_tables():  
    SQLModel.metadata.create_all(engine)

engine = create_engine(sqlite_url, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

Conn = Annotated[Session, Depends(get_session)]
