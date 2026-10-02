from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "a443c71f2f67"
down_revision: Union[str, Sequence[str], None] = "9c28d0b2e000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


VERIFICATION_VALUES = (
    "pending",
    "verified",
    "rejected",
    "review_required",
)


def create_enum(name: str):
    enum = postgresql.ENUM(
        *VERIFICATION_VALUES,
        name=name,
    )
    enum.create(op.get_bind(), checkfirst=True)
    return enum


def upgrade() -> None:
    # Vendor KYC enums
    create_enum("vendorninverificationstatus")
    create_enum("cacverificationstatus")

    # Dispatcher KYC enums
    create_enum("ninverificationstatus")
    create_enum("vehicleverificationstatus")

    # Both-role KYC enums
    create_enum("bothrolesninverificationstatus")
    create_enum("bothrolescacverificationstatus")
    create_enum("bothrolesvehicleverificationstatus")

    # Vendor
    op.add_column(
        "vendors",
        sa.Column(
            "nin_verification_status",
            postgresql.ENUM(
                *VERIFICATION_VALUES,
                name="vendorninverificationstatus",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
    )

    op.add_column(
        "vendors",
        sa.Column(
            "cac_verification_status",
            postgresql.ENUM(
                *VERIFICATION_VALUES,
                name="cacverificationstatus",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
    )

    # Dispatcher
    op.add_column(
        "dispatchers",
        sa.Column(
            "nin_verification_status",
            postgresql.ENUM(
                *VERIFICATION_VALUES,
                name="ninverificationstatus",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
    )

    op.add_column(
        "dispatchers",
        sa.Column(
            "vehicle_verification_status",
            postgresql.ENUM(
                *VERIFICATION_VALUES,
                name="vehicleverificationstatus",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
    )

    # Both roles
    op.add_column(
        "both_roles",
        sa.Column(
            "nin_verification_status",
            postgresql.ENUM(
                *VERIFICATION_VALUES,
                name="bothrolesninverificationstatus",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
    )

    op.add_column(
        "both_roles",
        sa.Column(
            "cac_verification_status",
            postgresql.ENUM(
                *VERIFICATION_VALUES,
                name="bothrolescacverificationstatus",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
    )

    op.add_column(
        "both_roles",
        sa.Column(
            "vehicle_verification_status",
            postgresql.ENUM(
                *VERIFICATION_VALUES,
                name="bothrolesvehicleverificationstatus",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
    )


def downgrade() -> None:
    op.drop_column("both_roles", "vehicle_verification_status")
    op.drop_column("both_roles", "cac_verification_status")
    op.drop_column("both_roles", "nin_verification_status")

    op.drop_column("dispatchers", "vehicle_verification_status")
    op.drop_column("dispatchers", "nin_verification_status")

    op.drop_column("vendors", "cac_verification_status")
    op.drop_column("vendors", "nin_verification_status")

    op.execute(
        "DROP TYPE IF EXISTS bothrolesvehicleverificationstatus"
    )
    op.execute(
        "DROP TYPE IF EXISTS bothrolescacverificationstatus"
    )
    op.execute(
        "DROP TYPE IF EXISTS bothrolesninverificationstatus"
    )
    op.execute(
        "DROP TYPE IF EXISTS vehicleverificationstatus"
    )
    op.execute(
        "DROP TYPE IF EXISTS ninverificationstatus"
    )
    op.execute(
        "DROP TYPE IF EXISTS cacverificationstatus"
    )
    op.execute(
        "DROP TYPE IF EXISTS vendorninverificationstatus"
    )
