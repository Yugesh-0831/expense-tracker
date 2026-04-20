from __future__ import annotations

import logging
from time import perf_counter
from uuid import uuid4

from fastapi import Request

from app.core.config import settings

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


def configure_logging() -> None:
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        format=LOG_FORMAT,
        force=True,
    )


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def attach_request_context(request: Request) -> float:
    request.state.request_id = str(uuid4())
    request.state.started_at = perf_counter()
    return request.state.started_at


def request_context(request: Request) -> dict[str, str | int | float]:
    request_id = getattr(request.state, "request_id", "unknown")
    duration_ms = 0.0
    if hasattr(request.state, "started_at"):
        duration_ms = round((perf_counter() - request.state.started_at) * 1000, 2)

    return {
        "request_id": request_id,
        "method": request.method,
        "path": request.url.path,
        "duration_ms": duration_ms,
    }
