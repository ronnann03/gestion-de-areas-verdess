from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import bcrypt
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.inertia import inertia_render, inertia_redirect

router = APIRouter()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return plain_password == hashed_password

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

@router.get("/")
def home(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if user_id:
        return RedirectResponse(url="/dashboard", status_code=303)
    return RedirectResponse(url="/login", status_code=303)

@router.get("/login")
def login_page(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if user_id:
        return RedirectResponse(url="/dashboard", status_code=303)

    return inertia_render(request, db, "auth/login", {
        "canResetPassword": True,
        "status": request.session.pop("status", None),
    })

@router.post("/login")
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    remember: bool = Form(False),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email.strip()).first()
    if not user or not verify_password(password, user.password):
        request.session["errors"] = {"email": "Las credenciales proporcionadas no son válidas."}
        return inertia_redirect("/login", request=request)

    request.session["user_id"] = user.id
    return inertia_redirect("/dashboard", flash_msg={"success": "Bienvenido al sistema"}, request=request)

@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return inertia_redirect("/login")
