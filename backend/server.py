from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Response, Request, Cookie
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import requests
import qrcode
from io import BytesIO
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_token: str
    user_id: str
    expires_at: datetime

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    image_url: Optional[str] = None
    available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MenuItemCreate(BaseModel):
    name: str
    price: float
    image_url: Optional[str] = None

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    available: Optional[bool] = None

class Table(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table_number: int
    qr_code_data: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TableCreate(BaseModel):
    table_number: int

class OrderItem(BaseModel):
    menu_item_id: str
    menu_item_name: str
    quantity: int
    price: float

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table_id: str
    table_number: int
    items: List[OrderItem]
    status: str = "pending"  # pending, preparing, completed
    total: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class OrderCreate(BaseModel):
    table_id: str
    items: List[OrderItem]

class OrderStatusUpdate(BaseModel):
    status: str

# Helper functions
async def get_current_user(request: Request) -> Optional[User]:
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    session = await db.sessions.find_one({"session_token": session_token})
    if not session or datetime.fromisoformat(session['expires_at']) < datetime.now(timezone.utc):
        return None
    
    user = await db.users.find_one({"id": session['user_id']}, {"_id": 0})
    return User(**user) if user else None

# Auth endpoints
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Exchange session_id for user data
    auth_response = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": session_id}
    )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    user_data = auth_response.json()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data['email']}, {"_id": 0})
    
    if not existing_user:
        # Create new user
        user = User(
            id=user_data['id'],
            email=user_data['email'],
            name=user_data['name'],
            picture=user_data.get('picture')
        )
        user_doc = user.model_dump()
        user_doc['created_at'] = user_doc['created_at'].isoformat()
        await db.users.insert_one(user_doc)
    else:
        user = User(**existing_user)
    
    # Create session
    session_token = user_data['session_token']
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = Session(
        session_token=session_token,
        user_id=user.id,
        expires_at=expires_at
    )
    
    session_doc = session.model_dump()
    session_doc['expires_at'] = session_doc['expires_at'].isoformat()
    await db.sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {"user": user.model_dump(), "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# Menu endpoints
@api_router.post("/menu", response_model=MenuItem)
async def create_menu_item(item: MenuItemCreate, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    menu_item = MenuItem(**item.model_dump())
    doc = menu_item.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.menu_items.insert_one(doc)
    return menu_item

@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item['created_at'], str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items

@api_router.put("/menu/{item_id}", response_model=MenuItem)
async def update_menu_item(item_id: str, update: MenuItemUpdate, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.menu_items.update_one({"id": item_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if isinstance(item['created_at'], str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    return MenuItem(**item)

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}

# Table endpoints
@api_router.post("/tables", response_model=Table)
async def create_table(table: TableCreate, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if table number already exists
    existing = await db.tables.find_one({"table_number": table.table_number})
    if existing:
        raise HTTPException(status_code=400, detail="Table number already exists")
    
    table_id = str(uuid.uuid4())
    frontend_url = os.environ.get('FRONTEND_URL', 'https://qr-table-menu.preview.emergentagent.com')
    qr_data = f"{frontend_url}/menu/{table_id}"
    
    table_obj = Table(
        id=table_id,
        table_number=table.table_number,
        qr_code_data=qr_data
    )
    
    doc = table_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.tables.insert_one(doc)
    return table_obj

@api_router.get("/tables", response_model=List[Table])
async def get_tables(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    tables = await db.tables.find({}, {"_id": 0}).to_list(1000)
    for table in tables:
        if isinstance(table['created_at'], str):
            table['created_at'] = datetime.fromisoformat(table['created_at'])
    return tables

@api_router.get("/tables/{table_id}/qr")
async def get_table_qr(table_id: str):
    table = await db.tables.find_one({"id": table_id}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(table['qr_code_data'])
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    
    return StreamingResponse(buf, media_type="image/png")

@api_router.delete("/tables/{table_id}")
async def delete_table(table_id: str, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.tables.delete_one({"id": table_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    return {"message": "Table deleted"}

# Order endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    # Verify table exists
    table = await db.tables.find_one({"id": order.table_id}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Calculate total
    total = sum(item.price * item.quantity for item in order.items)
    
    order_obj = Order(
        table_id=order.table_id,
        table_number=table['table_number'],
        items=[item.model_dump() for item in order.items],
        total=total
    )
    
    doc = order_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    
    # Broadcast new order to all connected WebSocket clients
    await manager.broadcast({
        "type": "new_order",
        "order": json.loads(order_obj.model_dump_json())
    })
    
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    query = {}
    if status:
        query['status'] = status
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if order.get('completed_at') and isinstance(order['completed_at'], str):
            order['completed_at'] = datetime.fromisoformat(order['completed_at'])
    return orders

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, update: OrderStatusUpdate, request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_data = {"status": update.status}
    if update.status == "completed":
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if order.get('completed_at') and isinstance(order['completed_at'], str):
        order['completed_at'] = datetime.fromisoformat(order['completed_at'])
    
    # Broadcast order update
    await manager.broadcast({
        "type": "order_update",
        "order": order
    })
    
    return Order(**order)

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()