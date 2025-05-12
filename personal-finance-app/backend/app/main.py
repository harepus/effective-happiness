from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router  # Correct import to use existing routes.py
from .core.config import settings
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Log the routes being registered
for route in router.routes:
    logger.debug(f"Registering route: {route.path}")

# Include the router directly
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)