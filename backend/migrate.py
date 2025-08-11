from database import SessionLocal, User, Base, engine
from sqlalchemy import text
from datetime import datetime

def migrate_database():
    """Migration script to add new columns to existing database"""
    db = SessionLocal()
    
    try:
        # Add password column to users table if it doesn't exist
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN password VARCHAR DEFAULT 'admin123'"))
            print("Added password column to users table")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("Password column already exists")
            else:
                print(f"Error adding password column: {e}")
        
        # Add created_at column to users table (SQLite doesn't support CURRENT_TIMESTAMP as default in ALTER)
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))
            print("Added created_at column to users table")
            
            # Update existing records with current timestamp
            db.execute(text("UPDATE users SET created_at = datetime('now') WHERE created_at IS NULL"))
            print("Updated existing users with current timestamp")
            
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print("Created_at column already exists")
            else:
                print(f"Error adding created_at column: {e}")
        
        # Update existing admin user with password if exists
        try:
            admin_user = db.query(User).filter(User.username == "admin").first()
            if admin_user and not admin_user.password:
                admin_user.password = "admin123"
                print("Updated admin user with default password")
        except Exception as e:
            print(f"Error updating admin user: {e}")
        
        db.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_database()