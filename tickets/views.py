
from django.db import transaction, IntegrityError

from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Route
from .serializers import RouteSerializer, BookingSerializer


class RouteListView(ListAPIView):
    """
    GET /api/routes/
    Returns all routes with their already-booked seats.
    """

    # Load the bus and bookings efficiently.
    queryset = (
        Route.objects
        .select_related('bus')
        .prefetch_related('bookings')
    )

    serializer_class = RouteSerializer

    # Return a plain list instead of a paginated response.
    pagination_class = None


class BookingCreateView(APIView):
    """
    POST /api/bookings/
    Books one seat on one route.
    """

    def post(self, request):
        route_id = request.data.get('route')

        try:
            # Everything inside this block is one database transaction.
            with transaction.atomic():

                # Lock the route while we check and create the booking.
                route = (
                    Route.objects
                    .select_for_update()
                    .filter(pk=route_id)
                    .first()
                )

                if route is None:
                    return Response(
                        {'route': ['This route does not exist.']},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                # Validate the booking data.
                serializer = BookingSerializer(data=request.data)

                if not serializer.is_valid():
                    return Response(
                        serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Save the booking.
                serializer.save()

        except (ValueError, TypeError):
            return Response(
                {'route': ['Route must be a valid number.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except IntegrityError:
            return Response(
                {
                    'seat_number': [
                        'That seat was just booked by someone else.'
                    ]
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

