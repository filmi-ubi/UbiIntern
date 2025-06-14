import asyncio
from auth import create_test_users

async def main():
    print("Setting up test users...")
    await create_test_users()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())