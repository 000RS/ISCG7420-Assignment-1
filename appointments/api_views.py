from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Doctor, AppointmentSlot
from .serializers import DoctorSerializer, AppointmentSlotSerializer

from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework import status

@api_view(['GET'])
@permission_classes([AllowAny])
def doctor_list_api(request):
    doctors = Doctor.objects.filter(active=True)
    serializer = DoctorSerializer(doctors, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def available_slots_api(request):
    slots = AppointmentSlot.objects.filter(
        is_available=True,
        doctor__active=True
    ).order_by('date', 'start_time')

    serializer = AppointmentSlotSerializer(slots, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Username and password are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(
        request,
        username=username,
        password=password
    )

    if user is None:
        return Response(
            {'error': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    token, created = Token.objects.get_or_create(user=user)

    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
        }
    })