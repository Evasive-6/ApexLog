from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.conf import settings
from hos_engine.views import index_view

dist_dir = settings.BASE_DIR.parent / "frontend" / "dist"
dist_assets_dir = dist_dir / "assets"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("hos_engine.urls")),
    re_path(r"^assets/(?P<path>.*)$", serve, {"document_root": dist_assets_dir}),
    re_path(r"^(?P<path>[^/]+\.(?:svg|png|ico|json|txt|xml))$", serve, {"document_root": dist_dir}),
    re_path(r"^(?!api/|admin/).*$", index_view, name="index"),
]
