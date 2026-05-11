from core.constants import ErrorCode


class AppError(Exception):
    """Domain exception raised by service functions. Route handlers map this to HTTPException."""

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        status_code: int = 400,
        details: dict[str, str] | None = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)
