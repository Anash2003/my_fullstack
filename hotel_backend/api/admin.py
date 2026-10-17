from django.contrib import admin
from api.models import *

# Register your models here.
admin.site.register(UserDetails)
admin.site.register(EmployeeDetails)
admin.site.register(RoomCategory)
admin.site.register(Room)
admin.site.register(Booking)
admin.site.register(Feedback)
admin.site.register(Complaint)

