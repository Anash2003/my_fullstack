"""
URL configuration for the API app.
All API endpoints are defined here.
"""

from django.urls import path
from api import views

urlpatterns = [
    # Auth
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/user/', views.current_user_view, name='current-user'),
    path('auth/register/', views.register_customer_view, name='register'),

    # Dashboards
    path('admin/dashboard/', views.admin_dashboard_view, name='admin-dashboard'),
    path('employee/dashboard/', views.employee_dashboard_view, name='employee-dashboard'),
    path('customer/dashboard/', views.customer_dashboard_view, name='customer-dashboard'),

    # Room Categories
    path('categories/', views.room_category_list_view, name='category-list'),
    path('categories/<int:pk>/', views.room_category_detail_view, name='category-detail'),

    # Rooms
    path('rooms/', views.room_list_view, name='room-list'),
    path('rooms/<int:pk>/', views.room_detail_view, name='room-detail'),
    path('rooms/available/', views.available_rooms_view, name='available-rooms'),

    # Bookings
    path('bookings/', views.booking_list_view, name='booking-list'),
    path('bookings/<int:pk>/', views.booking_detail_view, name='booking-detail'),
    path('bookings/<int:pk>/cancel/', views.cancel_booking_view, name='cancel-booking'),

    # Employees (admin)
    path('employees/', views.employee_list_view, name='employee-list'),
    path('employees/<int:pk>/toggle/', views.employee_toggle_active_view, name='employee-toggle'),

    # Customers
    path('customers/', views.customer_list_view, name='customer-list'),
    path('customer/profile/', views.customer_profile_view, name='customer-profile'),
    path('customer/register-walkin/', views.register_walkin_customer_view, name='register-walkin'),

    # Feedback & Complaints
    path('feedback/', views.feedback_list_view, name='feedback-list'),
    path('complaints/', views.complaint_list_view, name='complaint-list'),
    path('complaints/<int:pk>/', views.complaint_update_view, name='complaint-update'),
]
