import asyncio
from sqlalchemy import text
from app.core.session_config import engine

async def main():
    async with engine.connect() as connection:
        result = await connection.execute(
            text("""
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                      AND table_name = 'alembic_version'
                )
            """)
        )

        exists = result.scalar()
        print(f"alembic_version table exists: {exists}")

        if exists:
            result = await connection.execute(
                text("SELECT version_num FROM alembic_version")
            )
            rows = result.fetchall()

            print("Alembic versions:")
            for row in rows:
                print(row[0])

asyncio.run(main())
