
from django.db import models


class Bus(models.Model):
    number = models.CharField(max_length=10)
    name = models.CharField(max_length=20)
    total_seats = models.IntegerField()

    def __str__(self):
        return f"{self.name} ({self.number})"


class Route(models.Model):
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE)
    origin = models.CharField(max_length=50)
    destination = models.CharField(max_length=50)
    departure_time = models.DateTimeField()
    fare = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        ordering = ['departure_time']

    def __str__(self):
        return (
            f"{self.origin} to {self.destination} "
            f"at {self.departure_time:%Y-%m-%d %H:%M}"
        )


class Booking(models.Model):
    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name='bookings'
    )
    seat_number = models.IntegerField()
    passenger_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('route', 'seat_number')

    def __str__(self):
        return (
            f"Seat {self.seat_number} "
            f"on route {self.route_id} - {self.passenger_name}"
        )

