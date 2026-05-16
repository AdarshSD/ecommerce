"""add address label, label_name, state columns

Revision ID: 0003_address_label_state
Revises: 0002_product_display_fields
Create Date: 2026-05-13 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '0003_address_label_state'
down_revision: Union[str, None] = '0002_product_display_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('addresses', sa.Column('label', sa.String(length=10), nullable=False, server_default='other'))
    op.add_column('addresses', sa.Column('label_name', sa.String(length=100), nullable=True))
    op.add_column('addresses', sa.Column('state', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('addresses', 'state')
    op.drop_column('addresses', 'label_name')
    op.drop_column('addresses', 'label')
