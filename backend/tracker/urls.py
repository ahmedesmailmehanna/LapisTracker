from django.urls import path
from rest_framework.routers import DefaultRouter

from .progress import ExerciseProgressView, MacroTrendView
from .views import DailyMacroViewSet, ExerciseViewSet, SetEntryViewSet, WorkoutViewSet

# basename is required because the viewsets define get_queryset() instead of
# a class-level queryset, so the router cannot infer the name from a model.
router = DefaultRouter()
router.register("exercises", ExerciseViewSet, basename="exercise")
router.register("workouts", WorkoutViewSet, basename="workout")
router.register("sets", SetEntryViewSet, basename="setentry")
router.register("macros", DailyMacroViewSet, basename="dailymacro")

urlpatterns = [
    path(
        "progress/exercises/<int:exercise_id>/",
        ExerciseProgressView.as_view(),
        name="progress-exercise",
    ),
    path("progress/macros/", MacroTrendView.as_view(), name="progress-macros"),
] + router.urls
