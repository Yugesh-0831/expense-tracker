from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, expenses
from app.core.config import settings
from app.core.logging import attach_request_context, configure_logging, get_logger, request_context

configure_logging()
logger = get_logger(__name__)

app = FastAPI(title="Expense Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(expenses.router, prefix="/expenses", tags=["expenses"])


@app.middleware("http")
async def log_requests(request: Request, call_next):
    attach_request_context(request)
    logger.info("Request started", extra=request_context(request))

    try:
        response = await call_next(request)
    except Exception:
        logger.exception("Unhandled request error", extra=request_context(request))
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    logger.info(
        "Request completed",
        extra={**request_context(request), "status_code": response.status_code},
    )
    response.headers["X-Request-ID"] = request.state.request_id
    return response


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
