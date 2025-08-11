from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, User, Channel, Question, Participant, Answer
from pydantic import BaseModel
from datetime import datetime
import random
import string

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    username: str
    is_admin: bool = False

class ChannelCreate(BaseModel):
    name: str

class JoinChannel(BaseModel):
    code: str
    username: str

class SubmitAnswer(BaseModel):
    question_id: int
    selected_answer: str

class AdminLogin(BaseModel):
    username: str
    password: str

class QuestionCreate(BaseModel):
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str

class QuestionUpdate(BaseModel):
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str

class UserCreateAdmin(BaseModel):
    username: str
    password: str

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

@app.post("/users/")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(username=user.username, is_admin=user.is_admin)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/channels/")
def create_channel(channel: ChannelCreate, admin_username: str, db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.username == admin_username).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found")
    
    # Check if channel name already exists
    existing = db.query(Channel).filter(Channel.name == channel.name).first()
    if existing:
        raise HTTPException(status_code=409, detail="Channel name already exists")
    
    code = generate_code()
    db_channel = Channel(name=channel.name, code=code, admin_id=admin.id)
    db.add(db_channel)
    db.commit()
    db.refresh(db_channel)
    return db_channel

@app.post("/join-channel/")
def join_channel(join_data: JoinChannel, db: Session = Depends(get_db)):
    channel = db.query(Channel).filter(Channel.code == join_data.code).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    user = db.query(User).filter(User.username == join_data.username).first()
    if not user:
        user = User(username=join_data.username, is_admin=False)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    existing = db.query(Participant).filter(
        Participant.user_id == user.id, 
        Participant.channel_id == channel.id
    ).first()
    
    if existing:
        if existing.quiz_submitted:
            raise HTTPException(status_code=400, detail="You have already completed this quiz")
        else:
            # Reset timer for existing participant who hasn't submitted
            existing.quiz_started_at = datetime.utcnow()
            db.commit()
            participant = existing
    else:
        participant = Participant(user_id=user.id, channel_id=channel.id, quiz_started_at=datetime.utcnow())
        db.add(participant)
        db.commit()
        db.refresh(participant)
    
    return {
        "message": "Joined successfully", 
        "channel": channel.name,
        "quiz_started_at": participant.quiz_started_at.isoformat()
    }

@app.get("/questions/")
def get_questions(db: Session = Depends(get_db)):
    return db.query(Question).all()

@app.get("/questions/random/{count}")
def get_random_questions(count: int, db: Session = Depends(get_db)):
    import random
    all_questions = db.query(Question).all()
    if len(all_questions) <= count:
        return all_questions
    return random.sample(all_questions, count)

@app.post("/submit-answer/")
def submit_answer(answer_data: SubmitAnswer, username: str, channel_code: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    channel = db.query(Channel).filter(Channel.code == channel_code).first()
    
    if not user or not channel:
        raise HTTPException(status_code=404, detail="User or channel not found")
    
    participant = db.query(Participant).filter(
        Participant.user_id == user.id,
        Participant.channel_id == channel.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    question = db.query(Question).filter(Question.id == answer_data.question_id).first()
    is_correct = question.correct_answer == answer_data.selected_answer
    
    existing_answer = db.query(Answer).filter(
        Answer.participant_id == participant.id,
        Answer.question_id == answer_data.question_id
    ).first()
    
    if existing_answer:
        # Update existing answer
        existing_answer.selected_answer = answer_data.selected_answer
        existing_answer.is_correct = is_correct
        # Recalculate score
        participant.score = db.query(Answer).filter(
            Answer.participant_id == participant.id,
            Answer.is_correct == True
        ).count()
    else:
        # Create new answer
        answer = Answer(
            participant_id=participant.id,
            question_id=answer_data.question_id,
            selected_answer=answer_data.selected_answer,
            is_correct=is_correct
        )
        db.add(answer)
        if is_correct:
            participant.score += 1
    
    db.commit()
    return {"correct": is_correct, "score": participant.score}

@app.post("/submit-quiz/")
def submit_quiz(username: str, channel_code: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    channel = db.query(Channel).filter(Channel.code == channel_code).first()
    
    if not user or not channel:
        raise HTTPException(status_code=404, detail="User or channel not found")
    
    participant = db.query(Participant).filter(
        Participant.user_id == user.id,
        Participant.channel_id == channel.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    participant.quiz_submitted = True
    db.commit()
    
    return {"message": "Quiz submitted successfully", "final_score": participant.score}

@app.post("/admin/login")
def admin_login(login_data: AdminLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username, User.is_admin == True).first()
    if not user:
        # Create default admin if doesn't exist
        if login_data.username == "admin" and login_data.password == "admin123":
            admin = User(username="admin", password="admin123", is_admin=True)
            db.add(admin)
            db.commit()
            return {"success": True, "message": "Login successful"}
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.password == login_data.password:
        return {"success": True, "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/admin/questions")
def add_question(question_data: QuestionCreate, db: Session = Depends(get_db)):
    # Check if question already exists
    existing = db.query(Question).filter(Question.text == question_data.text).first()
    if existing:
        raise HTTPException(status_code=409, detail="Question already exists")
    
    question = Question(**question_data.dict())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

@app.put("/admin/questions/{question_id}")
def update_question(question_id: int, question_data: QuestionCreate, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if updated text conflicts with another question
    existing = db.query(Question).filter(Question.text == question_data.text, Question.id != question_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Question text already exists")
    
    for key, value in question_data.dict().items():
        setattr(question, key, value)
    
    db.commit()
    db.refresh(question)
    return question

@app.delete("/admin/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    # Check if question is used in any answers
    answers_count = db.query(Answer).filter(Answer.question_id == question_id).count()
    if answers_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete question that has been answered")
    
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db.delete(question)
    db.commit()
    return {"message": "Question deleted successfully"}

@app.get("/admin/results")
def get_all_results(db: Session = Depends(get_db)):
    participants = db.query(Participant).all()
    results = []
    for p in participants:
        answers = db.query(Answer).filter(Answer.participant_id == p.id).all()
        results.append({
            "username": p.user.username,
            "channel": p.channel.name,
            "score": p.score,
            "total_questions": len(answers),
            "answers": [{
                "question_id": a.question_id,
                "selected_answer": a.selected_answer,
                "is_correct": a.is_correct
            } for a in answers]
        })
    return results

@app.get("/admin/results/{username}")
def get_user_detailed_results(username: str, db: Session = Depends(get_db)):
    # URL decode the username
    from urllib.parse import unquote
    decoded_username = unquote(username)
    
    user = db.query(User).filter(User.username == decoded_username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{decoded_username}' not found")
    
    participant = db.query(Participant).filter(Participant.user_id == user.id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="No quiz results found")
    
    answers = db.query(Answer).filter(Answer.participant_id == participant.id).all()
    detailed_answers = []
    
    for answer in answers:
        question = db.query(Question).filter(Question.id == answer.question_id).first()
        detailed_answers.append({
            "question_text": question.text,
            "option_a": question.option_a,
            "option_b": question.option_b,
            "option_c": question.option_c,
            "option_d": question.option_d,
            "correct_answer": question.correct_answer,
            "selected_answer": answer.selected_answer,
            "is_correct": answer.is_correct
        })
    
    return {
        "username": user.username,
        "channel": participant.channel.name,
        "score": participant.score,
        "total_questions": len(detailed_answers),
        "answers": detailed_answers
    }

@app.delete("/admin/results")
def clear_all_results(db: Session = Depends(get_db)):
    # Delete all answers first (foreign key constraint)
    db.query(Answer).delete()
    # Delete all participants
    db.query(Participant).delete()
    # Delete all channels
    db.query(Channel).delete()
    db.commit()
    return {"message": "All results cleared successfully"}

@app.get("/admin/channels")
def get_all_channels(db: Session = Depends(get_db)):
    channels = db.query(Channel).all()
    return [{"id": c.id, "name": c.name, "code": c.code, "created_at": c.created_at.isoformat()} for c in channels]

@app.delete("/admin/channels/{channel_id}")
def delete_channel(channel_id: int, db: Session = Depends(get_db)):
    # Delete related data first
    participants = db.query(Participant).filter(Participant.channel_id == channel_id).all()
    for p in participants:
        db.query(Answer).filter(Answer.participant_id == p.id).delete()
    db.query(Participant).filter(Participant.channel_id == channel_id).delete()
    # Delete channel
    db.query(Channel).filter(Channel.id == channel_id).delete()
    db.commit()
    return {"message": "Channel deleted successfully"}

@app.get("/admin/users")
def get_admin_users(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.is_admin == True).all()
    return [{"id": u.id, "username": u.username, "created_at": u.created_at.isoformat()} for u in users]

@app.post("/admin/users")
def create_admin_user(user_data: UserCreateAdmin, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")
    
    user = User(username=user_data.username, password=user_data.password, is_admin=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "created_at": user.created_at.isoformat()}

@app.put("/admin/users/{username}/password")
def update_password(username: str, password_data: PasswordUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username, User.is_admin == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.password != password_data.current_password:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    user.password = password_data.new_password
    db.commit()
    return {"message": "Password updated successfully"}

@app.delete("/admin/users/{user_id}")
def delete_admin_user(user_id: int, current_username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.is_admin == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.username == current_username:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Check if user has created channels
    channels_count = db.query(Channel).filter(Channel.admin_id == user_id).count()
    if channels_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete user who has created channels")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}