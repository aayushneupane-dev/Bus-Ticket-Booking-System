
from django.urls import path

from .views import RouteListView, BookingCreateView


urlpatterns = [
    # GET /api/routes/
    path('routes/', RouteListView.as_view(), name='route-list'),

    # POST /api/bookings/
    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
]

