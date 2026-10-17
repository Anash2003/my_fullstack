"""
API views for the Hotel Management System.
Uses function-based views for simplicity.
Each view checks permissions based on user role (group).
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User, Group
from django.db import transaction
from django.db.models import Q, Sum, Count
from datetime import date, datetime

from api.models import (
    UserDetails, EmployeeDetails, RoomCategory, Room,
    Booking, Feedback, Complaint
)
from api.serializers import (
    UserSerializer, UserDetailsSerializer, EmployeeDetailsSerializer,
    RoomCategorySerializer, RoomSerializer, BookingSerializer,
    FeedbackSerializer, ComplaintSerializer, CustomerRegistrationSerializer
)


# ============ Helper Functions ============

def get_user_role(user):
    """Return the role of a user based on their group."""
    groups = user.groups.values_list('name', flat=True)
    if 'admin' in groups:
        return 'admin'
    elif 'employee' in groups:
        return 'employee'
    elif 'customer' in groups:
        return 'customer'
    return 'unknown'


def is_admin(user):
    return get_user_role(user) == 'admin'


def is_employee(user):
    return get_user_role(user) == 'employee'


def is_customer(user):
    return get_user_role(user) == 'customer'


def check_employee_active(user):
    """Check if an employee account is active."""
    try:
        details = EmployeeDetails.objects.get(user=user)
        return details.is_active_employee
    except EmployeeDetails.DoesNotExist:
        return False


# ============ Auth Views ============

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Log in a user with username and password. Returns user info and role."""
    username = request.data.get('username', '')
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({'error': 'Account is deactivated.'}, status=status.HTTP_403_FORBIDDEN)

    role = get_user_role(user)

    # Check if employee is deactivated
    if role == 'employee' and not check_employee_active(user):
        return Response({'error': 'Your employee account has been deactivated.'}, status=status.HTTP_403_FORBIDDEN)

    login(request, user)
    serializer = UserSerializer(user)
    return Response({'message': 'Login successful', 'user': serializer.data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Log out the current user."""
    logout(request)
    return Response({'message': 'Logged out successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """Return info about the currently logged-in user."""
    user = request.user
    role = get_user_role(user)

    # Check if employee is still active
    if role == 'employee' and not check_employee_active(user):
        logout(request)
        return Response({'error': 'Employee account deactivated.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserSerializer(user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_customer_view(request):
    """Register a new customer account."""
    serializer = CustomerRegistrationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    user = User.objects.create_user(
        username=data['username'],
        password=data['password'],
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name'],
    )
    customer_group, _ = Group.objects.get_or_create(name='customer')
    user.groups.add(customer_group)
    UserDetails.objects.create(user=user, phone=data.get('phone', ''))
    return Response({'message': 'Registration successful. You can now log in.'}, status=status.HTTP_201_CREATED)


# ============ Admin Dashboard ============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_view(request):
    """Return summary stats for admin dashboard."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    total_rooms = Room.objects.count()
    available_rooms = Room.objects.filter(status='available').count()
    occupied_rooms = Room.objects.filter(status='occupied').count()
    total_bookings = Booking.objects.count()
    active_bookings = Booking.objects.filter(status__in=['confirmed', 'checked_in']).count()
    total_revenue = Booking.objects.filter(status='checked_out').aggregate(total=Sum('total_amount'))['total'] or 0
    total_customers = User.objects.filter(groups__name='customer').count()
    total_employees = User.objects.filter(groups__name='employee').count()

    return Response({
        'total_rooms': total_rooms,
        'available_rooms': available_rooms,
        'occupied_rooms': occupied_rooms,
        'total_bookings': total_bookings,
        'active_bookings': active_bookings,
        'total_revenue': float(total_revenue),
        'total_customers': total_customers,
        'total_employees': total_employees,
    })


# ============ Room Category Views ============

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def room_category_list_view(request):
    """GET: list all categories. POST: create new category (admin only)."""
    if request.method == 'GET':
        categories = RoomCategory.objects.all()
        serializer = RoomCategorySerializer(categories, many=True)
        return Response(serializer.data)

    # POST - admin only
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = RoomCategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def room_category_detail_view(request, pk):
    """Update or delete a room category (admin only)."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        category = RoomCategory.objects.get(pk=pk)
    except RoomCategory.DoesNotExist:
        return Response({'error': 'Category not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = RoomCategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        category.delete()
        return Response({'message': 'Category deleted.'})


# ============ Room Views ============

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def room_list_view(request):
    """GET: list all rooms. POST: create a new room (admin only)."""
    if request.method == 'GET':
        rooms = Room.objects.select_related('category').all()

        # Optional filtering
        category_id = request.query_params.get('category')
        if category_id:
            rooms = rooms.filter(category_id=category_id)

        status_filter = request.query_params.get('status')
        if status_filter:
            rooms = rooms.filter(status=status_filter)

        min_price = request.query_params.get('min_price')
        if min_price:
            rooms = rooms.filter(price_per_night__gte=min_price)

        max_price = request.query_params.get('max_price')
        if max_price:
            rooms = rooms.filter(price_per_night__lte=max_price)

        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)

    # POST - admin only
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = RoomSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def room_detail_view(request, pk):
    """GET/PUT/DELETE a single room."""
    try:
        room = Room.objects.select_related('category').get(pk=pk)
    except Room.DoesNotExist:
        return Response({'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = RoomSerializer(room)
        return Response(serializer.data)

    # PUT and DELETE - admin only
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = RoomSerializer(room, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        room.delete()
        return Response({'message': 'Room deleted.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_rooms_view(request):
    """Return rooms available for given date range.
    Query params: check_in, check_out, category (optional)
    """
    check_in = request.query_params.get('check_in')
    check_out = request.query_params.get('check_out')

    if not check_in or not check_out:
        return Response({'error': 'check_in and check_out dates are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
        check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    if check_out_date <= check_in_date:
        return Response({'error': 'Check-out date must be after check-in date.'}, status=status.HTTP_400_BAD_REQUEST)

    # Find rooms that are bookable (not maintenance/cleaning)
    rooms = Room.objects.filter(status__in=['available', 'occupied']).select_related('category')

    # Exclude rooms with overlapping confirmed/checked-in bookings
    overlapping_bookings = Booking.objects.filter(
        status__in=['confirmed', 'checked_in'],
        check_in_date__lt=check_out_date,
        check_out_date__gt=check_in_date,
    ).values_list('room_id', flat=True)

    rooms = rooms.exclude(id__in=overlapping_bookings)

    # Optional category filter
    category_id = request.query_params.get('category')
    if category_id:
        rooms = rooms.filter(category_id=category_id)

    serializer = RoomSerializer(rooms, many=True)
    return Response(serializer.data)


# ============ Booking Views ============

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def booking_list_view(request):
    """
    GET: Admin/Employee see all bookings; Customer sees own bookings.
    POST: Create a new booking (customer or employee on behalf of customer).
    """
    user = request.user
    role = get_user_role(user)

    if request.method == 'GET':
        if role == 'admin':
            bookings = Booking.objects.all().order_by('-created_at')
        elif role == 'employee':
            if not check_employee_active(user):
                return Response({'error': 'Employee account deactivated.'}, status=status.HTTP_403_FORBIDDEN)
            bookings = Booking.objects.all().order_by('-created_at')
        else:
            # Customer sees only own bookings
            bookings = Booking.objects.filter(customer=user).order_by('-created_at')

        # Optional status filter
        status_filter = request.query_params.get('status')
        if status_filter:
            bookings = bookings.filter(status=status_filter)

        # Optional search by booking_id
        search = request.query_params.get('search')
        if search:
            bookings = bookings.filter(
                Q(booking_id__icontains=search) |
                Q(customer__username__icontains=search) |
                Q(customer__first_name__icontains=search) |
                Q(room__room_number__icontains=search)
            )

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    # POST - create booking
    if request.method == 'POST':
        room_id = request.data.get('room')
        check_in = request.data.get('check_in_date')
        check_out = request.data.get('check_out_date')

        # Employee can book on behalf of a customer
        if role == 'employee':
            if not check_employee_active(user):
                return Response({'error': 'Employee account deactivated.'}, status=status.HTTP_403_FORBIDDEN)
            customer_id = request.data.get('customer')
            if not customer_id:
                return Response({'error': 'Customer ID is required for employee bookings.'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                customer = User.objects.get(pk=customer_id)
            except User.DoesNotExist:
                return Response({'error': 'Customer not found.'}, status=status.HTTP_404_NOT_FOUND)
        elif role == 'customer':
            customer = user
        else:
            # Admin can also create bookings
            customer_id = request.data.get('customer')
            if customer_id:
                try:
                    customer = User.objects.get(pk=customer_id)
                except User.DoesNotExist:
                    return Response({'error': 'Customer not found.'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'Customer ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if not room_id or not check_in or not check_out:
            return Response({'error': 'Room, check-in date, and check-out date are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        if check_out_date <= check_in_date:
            return Response({'error': 'Check-out must be after check-in.'}, status=status.HTTP_400_BAD_REQUEST)

        if check_in_date < date.today():
            return Response({'error': 'Check-in date cannot be in the past.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            room = Room.objects.get(pk=room_id)
        except Room.DoesNotExist:
            return Response({'error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        if room.status in ['maintenance', 'cleaning']:
            return Response({'error': 'Room is not available for booking.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for overlapping bookings using a transaction for safety
        with transaction.atomic():
            overlapping = Booking.objects.select_for_update().filter(
                room=room,
                status__in=['confirmed', 'checked_in'],
                check_in_date__lt=check_out_date,
                check_out_date__gt=check_in_date,
            ).exists()

            if overlapping:
                return Response({'error': 'Room is already booked for these dates.'}, status=status.HTTP_400_BAD_REQUEST)

            # Calculate total amount
            num_nights = (check_out_date - check_in_date).days
            total_amount = num_nights * room.price_per_night

            booking = Booking.objects.create(
                customer=customer,
                room=room,
                check_in_date=check_in_date,
                check_out_date=check_out_date,
                status='confirmed',
                total_amount=total_amount,
            )

        serializer = BookingSerializer(booking)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def booking_detail_view(request, pk):
    """GET or UPDATE a single booking."""
    user = request.user
    role = get_user_role(user)

    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Customers can only view their own bookings
    if role == 'customer' and booking.customer != user:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = BookingSerializer(booking)
        return Response(serializer.data)

    # PUT - update booking status
    if request.method == 'PUT':
        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'Status is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Customers can only cancel their own confirmed bookings
        if role == 'customer':
            if booking.customer != user:
                return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)
            if new_status != 'cancelled':
                return Response({'error': 'You can only cancel bookings.'}, status=status.HTTP_400_BAD_REQUEST)
            if booking.status not in ['pending', 'confirmed']:
                return Response({'error': 'Only pending or confirmed bookings can be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        # If checking in, update room status to occupied
        if new_status == 'checked_in':
            if role not in ['admin', 'employee']:
                return Response({'error': 'Only admin or employee can check in.'}, status=status.HTTP_403_FORBIDDEN)
            if role == 'employee' and not check_employee_active(user):
                return Response({'error': 'Employee account deactivated.'}, status=status.HTTP_403_FORBIDDEN)
            if booking.status == 'checked_in':
                return Response({'error': 'Already checked in.'}, status=status.HTTP_400_BAD_REQUEST)
            if booking.status not in ['confirmed', 'pending']:
                return Response({'error': f'Cannot check in a booking with status "{booking.status}".'}, status=status.HTTP_400_BAD_REQUEST)
            booking.room.status = 'occupied'
            booking.room.save()

        # If checking out, update room status to available
        if new_status == 'checked_out':
            if role not in ['admin', 'employee']:
                return Response({'error': 'Only admin or employee can check out.'}, status=status.HTTP_403_FORBIDDEN)
            if role == 'employee' and not check_employee_active(user):
                return Response({'error': 'Employee account deactivated.'}, status=status.HTTP_403_FORBIDDEN)
            if booking.status == 'checked_out':
                return Response({'error': 'Already checked out.'}, status=status.HTTP_400_BAD_REQUEST)
            if booking.status != 'checked_in':
                return Response({'error': f'Cannot check out a booking with status "{booking.status}".'}, status=status.HTTP_400_BAD_REQUEST)
            booking.room.status = 'available'
            booking.room.save()

        booking.status = new_status
        booking.save()
        serializer = BookingSerializer(booking)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_booking_view(request, pk):
    """Cancel a booking. Customers can cancel their own; admin/employee can cancel any."""
    user = request.user
    role = get_user_role(user)

    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if role == 'customer' and booking.customer != user:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    if booking.status not in ['pending', 'confirmed']:
        return Response({'error': 'Only pending or confirmed bookings can be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

    booking.status = 'cancelled'
    booking.save()

    serializer = BookingSerializer(booking)
    return Response({'message': 'Booking cancelled.', 'booking': serializer.data})


# ============ Employee Management (Admin Only) ============

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def employee_list_view(request):
    """GET: list employees. POST: create new employee (admin only)."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        employees = EmployeeDetails.objects.select_related('user').all()
        serializer = EmployeeDetailsSerializer(employees, many=True)
        return Response(serializer.data)

    # POST - create employee
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email', '')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    phone = request.data.get('phone', '')
    position = request.data.get('position', 'Front Desk')

    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username, password=password, email=email,
        first_name=first_name, last_name=last_name,
    )
    employee_group, _ = Group.objects.get_or_create(name='employee')
    user.groups.add(employee_group)
    employee = EmployeeDetails.objects.create(user=user, phone=phone, position=position)

    serializer = EmployeeDetailsSerializer(employee)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def employee_toggle_active_view(request, pk):
    """Activate or deactivate an employee (admin only)."""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        employee = EmployeeDetails.objects.get(pk=pk)
    except EmployeeDetails.DoesNotExist:
        return Response({'error': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)

    employee.is_active_employee = not employee.is_active_employee
    employee.save()

    # Also toggle user's is_active
    employee.user.is_active = employee.is_active_employee
    employee.user.save()

    serializer = EmployeeDetailsSerializer(employee)
    return Response(serializer.data)


# ============ Customer Views (Admin) ============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_list_view(request):
    """List all customers (admin/employee only)."""
    role = get_user_role(request.user)
    if role not in ['admin', 'employee']:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    customers = User.objects.filter(groups__name='customer').prefetch_related('user_details')
    data = []
    for customer in customers:
        item = UserSerializer(customer).data
        try:
            details = UserDetails.objects.get(user=customer)
            item['phone'] = details.phone
            item['address'] = details.address
        except UserDetails.DoesNotExist:
            item['phone'] = ''
            item['address'] = ''
        data.append(item)
    return Response(data)


# ============ Customer Profile ============

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def customer_profile_view(request):
    """GET or UPDATE the current customer's profile."""
    if not is_customer(request.user):
        return Response({'error': 'Customer access required.'}, status=status.HTTP_403_FORBIDDEN)

    user = request.user
    details, _ = UserDetails.objects.get_or_create(user=user)

    if request.method == 'GET':
        return Response({
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': details.phone,
            'address': details.address,
            'id_proof': details.id_proof,
        })

    # PUT - update profile
    user.first_name = request.data.get('first_name', user.first_name)
    user.last_name = request.data.get('last_name', user.last_name)
    user.email = request.data.get('email', user.email)
    user.save()

    details.phone = request.data.get('phone', details.phone)
    details.address = request.data.get('address', details.address)
    details.id_proof = request.data.get('id_proof', details.id_proof)
    details.save()

    return Response({'message': 'Profile updated successfully.'})


# ============ Employee Register Walk-in Customer ============

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_walkin_customer_view(request):
    """Employee registers a walk-in customer."""
    role = get_user_role(request.user)
    if role not in ['admin', 'employee']:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    if role == 'employee' and not check_employee_active(request.user):
        return Response({'error': 'Employee account deactivated.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = CustomerRegistrationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    user = User.objects.create_user(
        username=data['username'],
        password=data['password'],
        email=data['email'],
        first_name=data['first_name'],
        last_name=data['last_name'],
    )
    customer_group, _ = Group.objects.get_or_create(name='customer')
    user.groups.add(customer_group)
    UserDetails.objects.create(user=user, phone=data.get('phone', ''))

    return Response({
        'message': 'Customer registered successfully.',
        'customer': UserSerializer(user).data,
    }, status=status.HTTP_201_CREATED)


# ============ Feedback Views ============

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def feedback_list_view(request):
    """GET: list feedback. POST: create feedback (customer only)."""
    role = get_user_role(request.user)

    if request.method == 'GET':
        if role in ['admin', 'employee']:
            feedbacks = Feedback.objects.all().order_by('-created_at')
        else:
            feedbacks = Feedback.objects.filter(customer=request.user).order_by('-created_at')
        serializer = FeedbackSerializer(feedbacks, many=True)
        return Response(serializer.data)

    # POST - customer creates feedback
    if not is_customer(request.user):
        return Response({'error': 'Only customers can submit feedback.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = FeedbackSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(customer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============ Complaint Views ============

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def complaint_list_view(request):
    """GET: list complaints. POST: create complaint (customer only)."""
    role = get_user_role(request.user)

    if request.method == 'GET':
        if role in ['admin', 'employee']:
            complaints = Complaint.objects.all().order_by('-created_at')
        else:
            complaints = Complaint.objects.filter(customer=request.user).order_by('-created_at')
        serializer = ComplaintSerializer(complaints, many=True)
        return Response(serializer.data)

    if not is_customer(request.user):
        return Response({'error': 'Only customers can submit complaints.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ComplaintSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(customer=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def complaint_update_view(request, pk):
    """Update complaint status/resolution (admin/employee only)."""
    role = get_user_role(request.user)
    if role not in ['admin', 'employee']:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        complaint = Complaint.objects.get(pk=pk)
    except Complaint.DoesNotExist:
        return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

    complaint.status = request.data.get('status', complaint.status)
    complaint.resolution = request.data.get('resolution', complaint.resolution)
    complaint.save()

    serializer = ComplaintSerializer(complaint)
    return Response(serializer.data)


# ============ Employee Dashboard ============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_dashboard_view(request):
    """Return summary stats for employee dashboard."""
    role = get_user_role(request.user)
    if role != 'employee':
        return Response({'error': 'Employee access required.'}, status=status.HTTP_403_FORBIDDEN)

    if not check_employee_active(request.user):
        return Response({'error': 'Employee account deactivated.'}, status=status.HTTP_403_FORBIDDEN)

    available_rooms = Room.objects.filter(status='available').count()
    occupied_rooms = Room.objects.filter(status='occupied').count()
    todays_checkins = Booking.objects.filter(check_in_date=date.today(), status='confirmed').count()
    todays_checkouts = Booking.objects.filter(check_out_date=date.today(), status='checked_in').count()
    pending_bookings = Booking.objects.filter(status='confirmed').count()

    return Response({
        'available_rooms': available_rooms,
        'occupied_rooms': occupied_rooms,
        'todays_checkins': todays_checkins,
        'todays_checkouts': todays_checkouts,
        'pending_bookings': pending_bookings,
    })


# ============ Customer Dashboard ============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_dashboard_view(request):
    """Return summary for customer dashboard."""
    if not is_customer(request.user):
        return Response({'error': 'Customer access required.'}, status=status.HTTP_403_FORBIDDEN)

    user = request.user
    upcoming = Booking.objects.filter(customer=user, status='confirmed', check_in_date__gte=date.today()).count()
    current = Booking.objects.filter(customer=user, status='checked_in').count()
    completed = Booking.objects.filter(customer=user, status='checked_out').count()
    cancelled = Booking.objects.filter(customer=user, status='cancelled').count()
    total_spent = Booking.objects.filter(customer=user, status='checked_out').aggregate(total=Sum('total_amount'))['total'] or 0

    return Response({
        'upcoming_bookings': upcoming,
        'current_stays': current,
        'completed_bookings': completed,
        'cancelled_bookings': cancelled,
        'total_spent': float(total_spent),
    })
