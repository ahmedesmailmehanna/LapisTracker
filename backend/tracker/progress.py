"""Read-only endpoints that feed the progress charts.

They are separate from the CRUD viewsets because charts need a different
shape of data: every point in a date range (not one page of 20), oldest
first, and already aggregated by the database.
"""

from datetime import timedelta

from django.db.models import F, Max
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DailyMacro, Exercise, SetEntry

MAX_DAYS = 3650


def start_date_from_request(request):
    """Read the optional ?days=N query parameter.

    Returns the first date to include, or None for "all time".
    """
    raw = request.query_params.get("days")
    if raw is None:
        return None
    try:
        days = int(raw)
    except ValueError:
        raise ValidationError({"days": "Must be a whole number."})
    if not 1 <= days <= MAX_DAYS:
        raise ValidationError({"days": f"Must be between 1 and {MAX_DAYS}."})
    return timezone.localdate() - timedelta(days=days)


class ExerciseProgressView(APIView):
    """Heaviest weight lifted per day for one exercise.

    GET /api/progress/exercises/<id>/?days=90
    -> [{"date": "2026-10-01", "max_weight_kg": "100.00"}, ...]
    """

    def get(self, request, exercise_id):
        # 404 if the exercise does not exist or belongs to someone else.
        exercise = get_object_or_404(Exercise, pk=exercise_id, owner=request.user)

        sets = SetEntry.objects.filter(exercise=exercise, workout__user=request.user)
        start_date = start_date_from_request(request)
        if start_date is not None:
            sets = sets.filter(workout__date__gte=start_date)

        # GROUP BY workout date, MAX(weight_kg): one row per training day.
        points = (
            sets.values(date=F("workout__date"))
            .annotate(max_weight_kg=Max("weight_kg"))
            .order_by("date")
        )
        return Response(list(points))


class MacroTrendView(APIView):
    """Daily calories and macros, oldest first.

    GET /api/progress/macros/?days=90
    -> [{"date": "...", "calories": 2400, "protein_g": "180.0", ...}, ...]
    """

    def get(self, request):
        logs = DailyMacro.objects.filter(user=request.user)
        start_date = start_date_from_request(request)
        if start_date is not None:
            logs = logs.filter(date__gte=start_date)

        points = logs.order_by("date").values(
            "date", "calories", "protein_g", "carbs_g", "fat_g"
        )
        return Response(list(points))
