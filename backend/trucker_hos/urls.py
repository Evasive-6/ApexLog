"""
URL configuration for trucker_hos project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

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
