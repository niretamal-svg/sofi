import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_state = Database()

def init_mongodb():
    """Initialize MongoDB connection."""
    try:
        logger.info(f"Connecting to MongoDB at {settings.mongodb_uri}...")
        db_state.client = AsyncIOMotorClient(settings.mongodb_uri)
        db_state.db = db_state.client[settings.mongodb_db_name]
        
        # Ping the database to verify connection
        db_state.client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database: {settings.mongodb_db_name}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e

def close_mongodb():
    """Close MongoDB connection."""
    if db_state.client:
        logger.info("Closing MongoDB connection...")
        db_state.client.close()
        logger.info("MongoDB connection closed.")

def get_db():
    """Get MongoDB database instance."""
    if db_state.db is None:
        raise Exception("Database not initialized. Call init_mongodb() first.")
    return db_state.db

def get_collection(collection_name: str):
    """Get a specific collection from the database."""
    return get_db()[collection_name]
