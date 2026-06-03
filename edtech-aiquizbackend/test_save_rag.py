from app.database import SessionLocal
from app.services.summary_to_rag import save_summary_to_rag

db = SessionLocal()
save_summary_to_rag(summary_id=1, db=db)
db.close()
