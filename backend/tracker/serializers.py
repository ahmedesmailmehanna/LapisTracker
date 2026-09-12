from rest_framework import serializers

from .models import Exercise, SetEntry, Workout


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ["id", "name", "category"]


class SetEntrySerializer(serializers.ModelSerializer):
    exercise_name = serializers.ReadOnlyField(source="exercise.name")

    class Meta:
        model = SetEntry
        fields = ["id", "workout", "exercise", "exercise_name", "reps", "weight_kg", "order"]


class WorkoutSerializer(serializers.ModelSerializer):
    sets = SetEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Workout
        fields = ["id", "date", "notes", "created_at", "sets"]
        read_only_fields = ["created_at"]
