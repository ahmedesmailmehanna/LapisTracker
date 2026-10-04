from rest_framework import serializers

from .models import DailyMacro, Exercise, SetEntry, Workout

# The owner/user fields are deliberately NOT serializer fields. A client can
# never choose who owns a record; the viewsets set it from request.user.


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name", "category"]

    def validate_name(self, value):
        # The database has a unique (owner, name) constraint, but owner is not
        # a serializer field, so DRF cannot check it automatically. Checking
        # here turns a duplicate into a 400 instead of a database error.
        user = self.context["request"].user
        duplicates = Exercise.objects.filter(owner=user, name__iexact=value)
        if self.instance is not None:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError("You already have an exercise with this name.")
        return value


class SetEntrySerializer(serializers.ModelSerializer):
    exercise_name = serializers.ReadOnlyField(source="exercise.name")

    class Meta:
        model = SetEntry
        fields = ["id", "workout", "exercise", "exercise_name", "reps", "weight_kg", "order"]

    # A set points at a workout and an exercise by id. Without these checks a
    # user could attach a set to somebody else's workout just by guessing ids.

    def validate_workout(self, workout):
        if workout.user != self.context["request"].user:
            raise serializers.ValidationError("Workout not found.")
        return workout

    def validate_exercise(self, exercise):
        if exercise.owner != self.context["request"].user:
            raise serializers.ValidationError("Exercise not found.")
        return exercise


class WorkoutSerializer(serializers.ModelSerializer):
    sets = SetEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Workout
        fields = ["id", "date", "workout_type", "notes", "created_at", "sets"]
        read_only_fields = ["created_at"]


class DailyMacroSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMacro
        fields = ["id", "date", "calories", "protein_g", "carbs_g", "fat_g", "notes", "created_at"]
        read_only_fields = ["created_at"]

    def validate_date(self, value):
        # Same reasoning as ExerciseSerializer.validate_name: enforce the
        # "one macro log per user per day" constraint with a clear 400.
        user = self.context["request"].user
        duplicates = DailyMacro.objects.filter(user=user, date=value)
        if self.instance is not None:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError("You already logged macros for this date.")
        return value
