from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-ada-002"
    CHROMADB_HOST: str = "localhost"
    CHROMADB_PORT: int = 8000
    COLLECTION_NAME: str = "lecture_chunks"
    DATABASE_URL: str

    class Config:
        env_file = ".env"

settings = Settings()
