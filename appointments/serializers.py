from rest_framework import serializers
from .models import Doctor, AppointmentSlot, Appointment


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = [
            'id',
            'name',
            'specialization',
            'phone',
            'email',
            'bio',
            'active',
        ]

class AppointmentSlotSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = AppointmentSlot
        fields = [
            'id',
            'doctor',
            'doctor_name',
            'date',
            'start_time',
            'end_time',
            'is_available',
        ]
