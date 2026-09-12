from django.contrib import admin

from .models import DailyMacro, Exercise, SetEntry, Workout


class SetEntryInline(admin.TabularInline):
    model = SetEntry
    extra = 1


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ["date", "workout_type", "user", "created_at"]
    list_filter = ["workout_type"]
    inlines = [SetEntryInline]


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ["name", "category"]


@admin.register(SetEntry)
class SetEntryAdmin(admin.ModelAdmin):
    list_display = ["workout", "exercise", "reps", "weight_kg", "order"]


@admin.register(DailyMacro)
class DailyMacroAdmin(admin.ModelAdmin):
    list_display = ["date", "calories", "protein_g", "carbs_g", "fat_g", "user"]
