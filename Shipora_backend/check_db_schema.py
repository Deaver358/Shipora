import asyncio
from sqlalchemy import text
from app.core.session_config import engine

async def main():
    async with engine.connect() as connection:
        for table in ["users", "vendors", "dispatchers", "both_roles"]:
            result = await connection.execute(
                text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = :table_name
                    ORDER BY ordinal_position
                """),
                {"table_name": table},
            )

            print(f"\n===== {table} =====")
            for row in result.fetchall():
                print(row[0])

asyncio.run(main())
