"""
Serializers convert Django model instances to/from JSON.
Used by Django REST Framework views.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from api.models import (
    UserDetails, EmployeeDetails, RoomCategory, Room,
    Booking, Feedback, Complaint
)


class UserSerializer(serializers.ModelSerializer):
    """Serialize basic user info."""
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active']

    def get_role(self, obj):
        """Return the user's role based on their group."""
        groups = obj.groups.values_list('name', flat=True)
        if 'admin' in groups:
            return 'admin'
        elif 'employee' in groups:
            return 'employee'
        elif 'customer' in groups:
            return 'customer'
        return 'unknown'


class UserDetailsSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserDetails
        fields = ['id', 'user', 'phone', 'address', 'id_proof']


class EmployeeDetailsSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = EmployeeDetails
        fields = ['id', 'user', 'phone', 'position', 'is_active_employee']


class RoomCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomCategory
        fields = ['id', 'name', 'description']


class RoomSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'room_number', 'category', 'category_name', 'price_per_night',
                  'description', 'amenities', 'status']


class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    room_category = serializers.CharField(source='room.category.name', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'booking_id', 'customer', 'customer_name', 'customer_username',
                  'room', 'room_number', 'room_category', 'check_in_date', 'check_out_date',
                  'status', 'total_amount', 'created_at', 'updated_at']
        read_only_fields = ['booking_id', 'total_amount', 'created_at', 'updated_at']


class FeedbackSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)

    class Meta:
        model = Feedback
        fields = ['id', 'customer', 'customer_name', 'booking', 'rating', 'comment', 'created_at']
        read_only_fields = ['customer', 'created_at']


class ComplaintSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)

    class Meta:
        model = Complaint
        fields = ['id', 'customer', 'customer_name', 'subject', 'description',
                  'status', 'resolution', 'created_at', 'updated_at']
        read_only_fields = ['customer', 'created_at', 'updated_at']


class CustomerRegistrationSerializer(serializers.Serializer):
    """For new customer registration."""
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(min_length=6)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30)
    phone = serializers.CharField(max_length=15, required=False, default='')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value
