from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.core.deps import get_current_user
from app.schemas.ai import ChatRequest, ChatResponse
from app.services import ai_service

router = APIRouter(tags=["AI Assistant"])


@router.post("/api/v1/ai/chat", response_model=ChatResponse)
@router.post("/ai/chat", response_model=ChatResponse)
def chat_with_ai(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Chat with the AI Financial Assistant.
    Securely accesses only the authenticated user's data.
    Available at both /ai/chat and /api/v1/ai/chat.
    """
    answer = ai_service.process_chat_message(db, current_user.id, payload.message)
    return ChatResponse(response=answer)
