from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

_client = None

def get_db():
    global _client
    if _client is None:
        _client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/adaptive_learning'))
    return _client.get_default_database()
