from database import Base, engine
import os

# Remove existing database
if os.path.exists("quiz.db"):
    os.remove("quiz.db")

# Create new database with updated schema
Base.metadata.create_all(bind=engine)
print("Database reset with new schema!")