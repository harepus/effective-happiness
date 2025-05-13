from fastapi import FastAPI, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .api.routes import router  # Correct import to use existing routes.py
from .core.config import settings
import logging
import json
import math

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a custom JSONEncoder to handle NaN, Infinity, and other special values
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        try:
            if isinstance(obj, float):
                if math.isnan(obj) or math.isinf(obj):
                    return 0.0  # Convert NaN and Infinity to 0
            return super().default(obj)
        except TypeError:
            return str(obj)  # Convert any non-serializable objects to strings

# Custom JSONResponse class that uses our custom encoder
class CustomJSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
            cls=CustomJSONEncoder,
        ).encode("utf-8")

app = FastAPI(title=settings.PROJECT_NAME, default_response_class=CustomJSONResponse)

# Add middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.debug(f"Response: {response.status_code}")
    return response

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.235:3000",
        "http://0.0.0.0:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",  # This allows all origins - for development only, remove in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a direct test route to the app
@app.get("/direct-test")
async def direct_test():
    logger.debug("Direct test route accessed")
    return {"status": "ok", "message": "Direct access to FastAPI works"}

# Add a direct upload test route
@app.post("/direct-upload")
async def direct_upload(file: UploadFile = File(...)):
    logger.debug(f"Direct upload received: {file.filename}")
    try:
        # Read a small sample of the file to verify it's valid
        content = await file.read(1024)  # Read first 1KB
        await file.seek(0)  # Reset file position
        
        # Get file info
        file_info = {
            "status": "ok",
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(content),
            "sample": content[:100].decode('utf-8', errors='replace') if content else "",
            "message": "File received successfully"
        }
        
        return file_info
    except Exception as e:
        logger.exception(f"Error in direct upload: {str(e)}")
        return {"status": "error", "message": f"Error processing upload: {str(e)}"}

# Log the routes being registered
for route in router.routes:
    logger.debug(f"Registering route: {route.path}")

# Include the router directly (no prefix)
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)