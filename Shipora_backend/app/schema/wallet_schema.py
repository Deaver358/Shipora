import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from ..models.wallet_transaction_model import TransactionType, TransactionStatus


class WalletBalanceResponse(BaseModel):
    # all amounts in naira for the frontend; backend stores kobo internally
    total_topped_up: float = 0
    total_earned: float
    total_refunded: float = 0
    total_spent: float = 0
    total_withdrawn: float
    pending_withdrawal: float
    available_balance: float
    held_for_delivery: float = 0


class WalletTransactionResponse(BaseModel):
    transaction_id: uuid.UUID
    shipment_id: Optional[uuid.UUID] = None
    type: TransactionType
    amount: float  # naira
    status: TransactionStatus
    paystack_reference: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WithdrawRequest(BaseModel):
    amount: float = Field(gt=0, description="Amount in naira to withdraw to the linked bank account.")


class TopupRequest(BaseModel):
    amount: float = Field(gt=0, description="Amount in naira to add to your Shipora balance.")
