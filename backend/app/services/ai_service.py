"""
AI Financial Assistant Service.
Processes user questions, interfaces with the LLM provider, executes financial tools,
and guarantees user data isolation.
"""
import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.services.financial_tools import execute_tool
from app.services.llm_provider import get_llm_provider, FallbackToolProvider

logger = logging.getLogger(__name__)


def process_chat_message(db: Session, user_id: str, message: str) -> str:
    """
    Process an incoming user message:
    1. Validates the input.
    2. Builds a secure tool executor scoped strictly to the authenticated user_id.
    3. Delegates to the modular LLM provider (OpenAI / Gemini / Fallback).
    4. Handles errors cleanly without exposing secrets or stack traces.
    """
    if not message or not message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )

    clean_message = message.strip()
    if len(clean_message) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message is too long. Please keep queries under 2000 characters."
        )

    # Scoped tool executor closure - user_id can NEVER be overridden by the LLM
    def tool_executor(tool_name: str, tool_args: dict) -> dict:
        return execute_tool(name=tool_name, args=tool_args, db=db, user_id=user_id)

    try:
        provider = get_llm_provider()
        answer = provider.chat(clean_message, tool_executor=tool_executor)
        return answer
    except Exception as e:
        logger.error(f"Error during AI chat processing: {str(e)}", exc_info=True)
        # Attempt safe fallback using deterministic tools
        try:
            fallback = FallbackToolProvider()
            return fallback.chat(clean_message, tool_executor=tool_executor)
        except Exception as fallback_err:
            logger.error(f"Fallback also failed: {str(fallback_err)}")
            return "I apologize, but I encountered an issue accessing your financial records right now. Please try again shortly."
