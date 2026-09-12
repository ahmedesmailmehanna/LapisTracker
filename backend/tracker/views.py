from rest_framework import viewsets

from .models import Exercise, SetEntry, Workout
from .serializers import ExerciseSerializer, SetEntrySerializer, WorkoutSerializer


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer


class WorkoutViewSet(viewsets.ModelViewSet):
    queryset = Workout.objects.prefetch_related("sets__exercise").all()
    serializer_class = WorkoutSerializer


class SetEntryViewSet(viewsets.ModelViewSet):
    queryset = SetEntry.objects.select_related("exercise", "workout").all()
    serializer_class = SetEntrySerializer
