"""
Database models for the Hotel Management System.

We use Django's built-in User model for authentication.
Roles (admin, employee, customer) are managed using Django Groups.
Additional profile info is stored in UserDetails and EmployeeDetails.
"""

from django.db import models
from django.contrib.auth.models import User
import uuid


class UserDetails(models.Model):
    """Extra profile info for customers."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_details')
    phone = models.CharField(max_length=15, blank=True, default='')
    address = models.TextField(blank=True, default='')
    id_proof = models.CharField(max_length=50, blank=True, default='')

    def __str__(self):
        return f"Customer: {self.user.username}"


class EmployeeDetails(models.Model):
    """Extra profile info for employees."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_details')
    phone = models.CharField(max_length=15, blank=True, default='')
    position = models.CharField(max_length=50, default='Front Desk')
    is_active_employee = models.BooleanField(default=True)

    def __str__(self):
        return f"Employee: {self.user.username}"


class RoomCategory(models.Model):
    """Room categories like Luxury Suite, Premium Class, Economy Class."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')

    class Meta:
        verbose_name_plural = 'Room Categories'

    def __str__(self):
        return self.name


# Room status choices
ROOM_STATUS_CHOICES = [
    ('available', 'Available'),
    ('occupied', 'Occupied'),
    ('maintenance', 'Maintenance'),
    ('cleaning', 'Cleaning'),
]


class Room(models.Model):
    """A hotel room with a unique number, category, price, and status."""
    room_number = models.CharField(max_length=10, unique=True)
    category = models.ForeignKey(RoomCategory, on_delete=models.CASCADE, related_name='rooms')
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, default='')
    amenities = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=ROOM_STATUS_CHOICES, default='available')

    def __str__(self):
        return f"Room {self.room_number} ({self.category.name})"


# Booking status choices
BOOKING_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('confirmed', 'Confirmed'),
    ('checked_in', 'Checked In'),
    ('checked_out', 'Checked Out'),
    ('cancelled', 'Cancelled'),
]


class Booking(models.Model):
    """A reservation made by a customer for a specific room and dates."""
    booking_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking {self.booking_id} - Room {self.room.room_number}"


class Feedback(models.Model):
    """Customer feedback with a rating."""
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='feedbacks', null=True, blank=True)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1 to 5
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback by {self.customer.username} - Rating: {self.rating}"


class Complaint(models.Model):
    """Customer complaints with resolution tracking."""
    COMPLAINT_STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=COMPLAINT_STATUS_CHOICES, default='open')
    resolution = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Complaint: {self.subject} ({self.status})"
