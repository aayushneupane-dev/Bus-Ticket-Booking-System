from rest_framework import serializers

from .models import Bus, Route, Booking


class RouteSerializer(serializers.ModelSerializer):
    bus_name = serializers.CharField(
        source='bus.name',
        read_only=True
    )

    bus_number = serializers.CharField(
        source='bus.number',
        read_only=True
    )

    total_seats = serializers.IntegerField(
        source='bus.total_seats',
        read_only=True
    )

    booked_seats = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = [
            'id',
            'bus',
            'bus_name',
            'bus_number',
            'total_seats',
            'origin',
            'destination',
            'departure_time',
            'fare',
            'booked_seats',
        ]

    def get_booked_seats(self, route):
        return [
            booking.seat_number
            for booking in route.bookings.all()
        ]


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'id',
            'route',
            'seat_number',
            'passenger_name',
            'phone_number',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
        ]

    def validate(self, data):
        route = data.get('route')
        seat = data.get('seat_number')

        # Check 1: the seat must exist on this bus.
        if seat < 1 or seat > route.bus.total_seats:
            raise serializers.ValidationError(
                f"Seat number must be between 1 and "
                f"{route.bus.total_seats}."
            )

        # Check 2: is this seat already booked on this route?
        if Booking.objects.filter(
            route=route,
            seat_number=seat
        ).exists():
            raise serializers.ValidationError(
                {
                    'seat_number':
                    f'Seat {seat} is already booked for this route.'
                }
            )

        return data