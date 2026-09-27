from pydantic import BaseModel, Field


class ChatMessageItem(BaseModel):
    role: str = Field(description="Sender role: user or assistant")
    content: str = Field(description="Message body")


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessageItem] = Field(default_factory=list, description="Recent conversation turns")


class ChatResponse(BaseModel):
    response: str
