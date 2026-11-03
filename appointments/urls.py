from django.urls import path
from .import views
from . import api_views

urlpatterns = [
    path('', views.home, name='home'),
    path('doctors/', views.doctor_list, name='doctor_list'),
    path('slots/', views.available_slots, name='available_slots'),
    path('book/<int:slot_id>/', views.book_appointment, name='book_appointment'),

    path('my_appointments/', views.my_appointments, name='my_appointments'),
    path('my-appointments/<int:appointment_id>/edit/', views.edit_appointment,name = 'edit_appointment'),
    path('my-appointments/<int:appointment_id>/cancel/', views.cancel_appointment, name='cancel_appointment'),

    path('dashboard/', views.dashboard, name='dashboard'),
    path('dashboard/doctors/add', views.doctor_create, name = 'doctor_create'),
    path('dashboard/doctors/<int:doctor_id>/edit/', views.doctor_edit, name = 'doctor_edit'),
    path('dashboard/doctors/<int:doctor_id>/delete/', views.doctor_delete, name = 'doctor_delete'),

    path('dashboard/slots/add/', views.slot_create, name = 'slot_create'),
    path('dashboard/slots/<int:slot_id>/edit/', views.slot_edit, name = 'slot_edit'),
    path('dashboard/slots/<int:slot_id>/delete/', views.slot_delete, name = 'slot_delete'),

    path('dashboard/appointments/<int:appointment_id>/edit/', views.staff_appointment_edit, name='staff_appointment_edit'),
    path('dashboard/appointments/<int:appointment_id>/cancel/', views.staff_appointment_cancel, name='staff_appointment_cancel'),

    path('dashboard/patients/', views.patient_list, name = 'patient_list'),
    path('dashboard/patients/<int:patient_id>/toggle-active/', views.patient_toggle_active, name = 'patient_toggle_active'),

    path('api/doctors/', api_views.doctor_list_api, name='api_doctor_list'),
    path('api/slots/', api_views.available_slots_api, name='api_available_slots'),
    path('api/login/', api_views.login_api, name='api_login'),







]
