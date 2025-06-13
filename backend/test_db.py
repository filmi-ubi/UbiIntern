import asyncio
import asyncpg

async def test_connection():
    try:
        # Try to connect to the database
        conn = await asyncpg.connect(
            host='localhost',
            port=5432,
            user='webapp_service',
            password='',  # We need to get this
            database='automation_platform'
        )
        
        # Test query
        result = await conn.fetchval("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        print(f"✅ Database connected! Found {result} tables")
        
        # Test Eric's schema
        customers = await conn.fetchval("SELECT COUNT(*) FROM organizations;")
        print(f"✅ Organizations table: {customers} records")
        
        await conn.close()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_connection())
