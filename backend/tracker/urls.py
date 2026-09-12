from rest_framework.routers import DefaultRouter

from .views import ExerciseViewSet, SetEntryViewSet, WorkoutViewSet

router = DefaultRouter()
router.register("exercises", ExerciseViewSet)
router.register("workouts", WorkoutViewSet)
router.register("sets", SetEntryViewSet)

urlpatterns = router.urls
