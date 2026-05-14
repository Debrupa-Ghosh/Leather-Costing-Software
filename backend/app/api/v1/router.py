from fastapi import APIRouter
from app.api.v1.endpoints import auth, inventory, products, production, orders, customers, ai_endpoints, dashboard, quality

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(inventory.router)
api_router.include_router(products.router)
api_router.include_router(production.router)
api_router.include_router(orders.router)
api_router.include_router(customers.router)
api_router.include_router(ai_endpoints.router)
api_router.include_router(quality.router)
