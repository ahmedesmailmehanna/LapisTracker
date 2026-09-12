from rest_framework.routers import DefaultRouter

from .views import DailyMacroViewSet, ExerciseViewSet, SetEntryViewSet, WorkoutViewSet

router = DefaultRouter()
router.register("exercises", ExerciseViewSet)
router.register("workouts", WorkoutViewSet)
router.register("sets", SetEntryViewSet)
router.register("macros", DailyMacroViewSet)

urlpatterns = router.urls
