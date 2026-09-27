from passlib.context import CryptContext
from user_agents import parse
from fastapi import Request

password_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

def hash_password(password: str):
    return password_context.hash(password)

def verify_hash(password: str, hash: str):
    return password_context.verify(password, hash)