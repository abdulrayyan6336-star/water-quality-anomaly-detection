from backend.app.routes.auth import router as auth_router
from backend.app.routes.stations import router as stations_router
from backend.app.routes.samples import router as samples_router
from backend.app.routes.anomaly import router as anomaly_router
from backend.app.routes.sampling import router as sampling_router
from backend.app.routes.analytics import router as analytics_router
from backend.app.routes.alerts import router as alerts_router
from backend.app.routes.dashboard import router as dashboard_router

__all__ = [
    "auth_router",
    "stations_router",
    "samples_router",
    "anomaly_router",
    "sampling_router",
    "analytics_router",
    "alerts_router",
    "dashboard_router"
]
