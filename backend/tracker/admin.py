from django.contrib import admin

from .models import Exercise, SetEntry, Workout


class SetEntryInline(admin.TabularInline):
    model = SetEntry
    extra = 1


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ["date", "user", "created_at"]
    inlines = [SetEntryInline]


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ["name", "category"]


@admin.register(SetEntry)
class SetEntryAdmin(admin.ModelAdmin):
    list_display = ["workout", "exercise", "reps", "weight_kg", "order"]
