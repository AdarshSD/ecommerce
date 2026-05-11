import logging

logger = logging.getLogger(__name__)


def send_password_reset_email(user_email: str, raw_token: str) -> None:
    # [P3-EMAIL] stub — log only, never send
    logger.info("[EMAIL-STUB] Password reset email would be sent to %s (token: %s...)", user_email, raw_token[:8])


def send_order_confirmation(user_email: str, order_id: str, total: float) -> None:
    # [P3-EMAIL] stub
    logger.info("[EMAIL-STUB] Order confirmation would be sent to %s — order %s ($%.2f)", user_email, order_id, total)


def send_shipping_update(user_email: str, order_id: str, tracking_number: str) -> None:
    # [P3-EMAIL] stub
    logger.info("[EMAIL-STUB] Shipping update would be sent to %s — order %s tracking %s", user_email, order_id, tracking_number)


def send_email_verification(user_email: str, raw_token: str) -> None:
    # [P3-EMAIL] stub
    logger.info("[EMAIL-STUB] Email verification would be sent to %s", user_email)
