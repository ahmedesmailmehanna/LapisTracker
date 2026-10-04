from django.conf import settings
from django.db import models


class Exercise(models.Model):
    class Category(models.TextChoices):
        PUSH = "push", "Push"
        PULL = "pull", "Pull"
        LEGS = "legs", "Legs"
        CORE = "core", "Core"
        CARDIO = "cardio", "Cardio"
        OTHER = "other", "Other"

    # Each user has their own exercise list. Nullable only because exercises
    # created before authentication existed have no owner; the API never
    # creates an exercise without one (see ExerciseViewSet.perform_create).
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="exercises",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "name"], name="unique_exercise_name_per_owner"
            ),
        ]

    def __str__(self):
        return self.name


class Workout(models.Model):
    class WorkoutType(models.TextChoices):
        STRENGTH = "strength", "Strength"
        CARDIO = "cardio", "Cardio"
        HIIT = "hiit", "HIIT"
        MOBILITY = "mobility", "Mobility"
        OTHER = "other", "Other"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workouts",
        null=True,
        blank=True,
    )
    date = models.DateField()
    workout_type = models.CharField(
        max_length=20, choices=WorkoutType.choices, default=WorkoutType.STRENGTH
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.get_workout_type_display()} workout on {self.date}"


class SetEntry(models.Model):
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name="sets")
    exercise = models.ForeignKey(Exercise, on_delete=models.PROTECT, related_name="sets")
    reps = models.PositiveIntegerField()
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.exercise.name}: {self.reps} x {self.weight_kg}kg"


class DailyMacro(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_macros",
        null=True,
        blank=True,
    )
    date = models.DateField()
    calories = models.PositiveIntegerField()
    protein_g = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    carbs_g = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    fat_g = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]
        constraints = [
            models.UniqueConstraint(fields=["user", "date"], name="one_macro_log_per_user_per_day"),
        ]

    def __str__(self):
        return f"Macros for {self.date}: {self.calories} kcal"
