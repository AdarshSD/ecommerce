"""add product display fields for UI

Revision ID: 0002_product_display_fields
Revises: c7ccd0843c75
Create Date: 2026-05-11 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0002_product_display_fields'
down_revision: Union[str, None] = 'c7ccd0843c75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('long_description', sa.Text(), nullable=True))
    op.add_column('products', sa.Column('original_price', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('products', sa.Column('rating', sa.Numeric(precision=3, scale=2), nullable=True))
    op.add_column('products', sa.Column('reviews_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('products', sa.Column('is_new_arrival', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('products', sa.Column('badge', sa.String(length=50), nullable=True))
    op.add_column('products', sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'))
    op.create_index('ix_products_is_new_arrival', 'products', ['is_new_arrival'])


def downgrade() -> None:
    op.drop_index('ix_products_is_new_arrival', table_name='products')
    op.drop_column('products', 'tags')
    op.drop_column('products', 'badge')
    op.drop_column('products', 'is_new_arrival')
    op.drop_column('products', 'reviews_count')
    op.drop_column('products', 'rating')
    op.drop_column('products', 'original_price')
    op.drop_column('products', 'long_description')
