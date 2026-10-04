from rest_framework import viewsets

from .models import DailyMacro, Exercise, SetEntry, Workout
from .serializers import (
    DailyMacroSerializer,
    ExerciseSerializer,
    SetEntrySerializer,
    WorkoutSerializer,
)

# Data isolation rule used by every viewset below:
#   - get_queryset() only returns rows that belong to request.user, so
#     list/retrieve/update/delete on somebody else's row is a 404.
#   - perform_create() stamps the new row with request.user.
# Authentication itself is enforced globally (see REST_FRAMEWORK in settings).


class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer

    def get_queryset(self):
        return Exercise.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class WorkoutViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutSerializer

    def get_queryset(self):
        return Workout.objects.filter(user=self.request.user).prefetch_related("sets__exercise")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SetEntryViewSet(viewsets.ModelViewSet):
    serializer_class = SetEntrySerializer

    def get_queryset(self):
        # A set has no user column of its own; it belongs to whoever owns
        # its workout.
        return SetEntry.objects.filter(workout__user=self.request.user).select_related(
            "exercise", "workout"
        )


class DailyMacroViewSet(viewsets.ModelViewSet):
    serializer_class = DailyMacroSerializer

    def get_queryset(self):
        return DailyMacro.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
