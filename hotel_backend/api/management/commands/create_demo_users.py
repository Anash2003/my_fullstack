"""
Management command to create demo users and initial room data.
Safe to run multiple times - skips existing accounts and data.

Usage: python manage.py create_demo_users
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from api.models import (
    UserDetails, EmployeeDetails, RoomCategory, Room
)


class Command(BaseCommand):
    help = 'Create demo users (admin, employee, customer) and sample room data'

    def handle(self, *args, **options):
        # --- Create role groups ---
        admin_group, _ = Group.objects.get_or_create(name='admin')
        employee_group, _ = Group.objects.get_or_create(name='employee')
        customer_group, _ = Group.objects.get_or_create(name='customer')
        self.stdout.write('[OK] Role groups created')

        # --- Create Admin user ---
        admin_user, created = User.objects.get_or_create(
            username='admin_test',
            defaults={
                'email': 'admin@hotel.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('Admin@12345')
            admin_user.save()
        admin_user.groups.add(admin_group)
        status = 'created' if created else 'already exists'
        self.stdout.write('[OK] Admin user: admin_test (%s)' % status)

        # --- Create Employee user ---
        employee_user, created = User.objects.get_or_create(
            username='employee_test',
            defaults={
                'email': 'employee@hotel.com',
                'first_name': 'Employee',
                'last_name': 'User',
                'is_staff': False,
            }
        )
        if created:
            employee_user.set_password('Employee@12345')
            employee_user.save()
        employee_user.groups.add(employee_group)
        EmployeeDetails.objects.get_or_create(
            user=employee_user,
            defaults={'phone': '9876543210', 'position': 'Front Desk'}
        )
        status = 'created' if created else 'already exists'
        self.stdout.write('[OK] Employee user: employee_test (%s)' % status)

        # --- Create Customer user ---
        customer_user, created = User.objects.get_or_create(
            username='user_test',
            defaults={
                'email': 'user@hotel.com',
                'first_name': 'Test',
                'last_name': 'Customer',
                'is_staff': False,
            }
        )
        if created:
            customer_user.set_password('User@12345')
            customer_user.save()
        customer_user.groups.add(customer_group)
        UserDetails.objects.get_or_create(
            user=customer_user,
            defaults={'phone': '1234567890', 'address': '123 Test Street'}
        )
        status = 'created' if created else 'already exists'
        self.stdout.write('[OK] Customer user: user_test (%s)' % status)

        # --- Create Room Categories ---
        categories_data = [
            {'name': 'Luxury Suite', 'description': 'Spacious suite with premium amenities, king-size bed, and city view.'},
            {'name': 'Premium Class', 'description': 'Comfortable room with modern amenities and queen-size bed.'},
            {'name': 'Economy Class', 'description': 'Clean and cozy room with essential amenities at an affordable price.'},
        ]
        categories = {}
        for cat_data in categories_data:
            cat, _ = RoomCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults={'description': cat_data['description']}
            )
            categories[cat.name] = cat
        self.stdout.write('[OK] Room categories created')

        # --- Create Sample Rooms ---
        rooms_data = [
            {'room_number': '101', 'category': 'Luxury Suite', 'price': 5000, 'description': 'Ocean view luxury suite', 'amenities': 'King Bed, AC, WiFi, Mini Bar, Balcony'},
            {'room_number': '102', 'category': 'Luxury Suite', 'price': 5500, 'description': 'Garden view luxury suite', 'amenities': 'King Bed, AC, WiFi, Mini Bar, Jacuzzi'},
            {'room_number': '201', 'category': 'Premium Class', 'price': 3000, 'description': 'Premium room second floor', 'amenities': 'Queen Bed, AC, WiFi, TV'},
            {'room_number': '202', 'category': 'Premium Class', 'price': 3000, 'description': 'Premium room with city view', 'amenities': 'Queen Bed, AC, WiFi, TV'},
            {'room_number': '203', 'category': 'Premium Class', 'price': 3200, 'description': 'Premium corner room', 'amenities': 'Queen Bed, AC, WiFi, TV, Desk'},
            {'room_number': '301', 'category': 'Economy Class', 'price': 1500, 'description': 'Economy room', 'amenities': 'Single Bed, AC, WiFi'},
            {'room_number': '302', 'category': 'Economy Class', 'price': 1500, 'description': 'Economy room near elevator', 'amenities': 'Single Bed, AC, WiFi'},
            {'room_number': '303', 'category': 'Economy Class', 'price': 1800, 'description': 'Economy double room', 'amenities': 'Double Bed, AC, WiFi, TV'},
        ]
        for room_data in rooms_data:
            Room.objects.get_or_create(
                room_number=room_data['room_number'],
                defaults={
                    'category': categories[room_data['category']],
                    'price_per_night': room_data['price'],
                    'description': room_data['description'],
                    'amenities': room_data['amenities'],
                    'status': 'available',
                }
            )
        self.stdout.write('[OK] Sample rooms created')

        self.stdout.write(self.style.SUCCESS('\n[DONE] Demo setup complete! You can now log in with:'))
        self.stdout.write('  Admin:    admin_test / Admin@12345')
        self.stdout.write('  Employee: employee_test / Employee@12345')
        self.stdout.write('  Customer: user_test / User@12345')
