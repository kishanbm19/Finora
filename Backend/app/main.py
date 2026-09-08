from fastapi import FastAPI

app = FastAPI(
    title="Finora API",
    description="Financial Management System API",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "Welcome to Finora API"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }