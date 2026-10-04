from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from tracker.models import DailyMacro, Exercise, SetEntry, Workout

from .helpers import TwoUserAPITestCase


class ExerciseProgressTests(TwoUserAPITestCase):
    def setUp(self):
        super().setUp()
        self.squat = Exercise.objects.create(owner=self.user, name="Squat")
        self.url = reverse("progress-exercise", args=[self.squat.id])

    def log_set(self, date, weight, exercise=None, user=None):
        workout = Workout.objects.create(user=user or self.user, date=date)
        SetEntry.objects.create(
            workout=workout, exercise=exercise or self.squat, reps=5, weight_kg=weight
        )

    def test_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_heaviest_set_per_day_oldest_first(self):
        self.log_set("2026-10-03", "105")
        self.log_set("2026-10-01", "95")
        self.log_set("2026-10-01", "100")  # second workout on the same day

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [(str(p["date"]), Decimal(p["max_weight_kg"])) for p in response.data],
            [("2026-10-01", Decimal("100")), ("2026-10-03", Decimal("105"))],
        )

    def test_only_counts_the_requested_exercise(self):
        bench = Exercise.objects.create(owner=self.user, name="Bench Press")
        self.log_set("2026-10-01", "100")
        self.log_set("2026-10-01", "60", exercise=bench)

        response = self.client.get(self.url)

        self.assertEqual(len(response.data), 1)
        self.assertEqual(Decimal(response.data[0]["max_weight_kg"]), Decimal("100"))

    def test_days_parameter_limits_the_range(self):
        today = timezone.localdate()
        self.log_set(today - timedelta(days=5), "100")
        self.log_set(today - timedelta(days=60), "90")

        response = self.client.get(self.url, {"days": 30})

        self.assertEqual(len(response.data), 1)
        self.assertEqual(Decimal(response.data[0]["max_weight_kg"]), Decimal("100"))

    def test_invalid_days_parameter_is_rejected(self):
        for bad_value in ["abc", "0", "-5", "999999"]:
            response = self.client.get(self.url, {"days": bad_value})
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST, bad_value)

    def test_another_users_exercise_is_not_found(self):
        other_exercise = Exercise.objects.create(owner=self.other_user, name="Squat")
        self.log_set("2026-10-01", "200", exercise=other_exercise, user=self.other_user)

        response = self.client.get(reverse("progress-exercise", args=[other_exercise.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_exercise_with_no_sets_returns_empty_list(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


class MacroTrendTests(TwoUserAPITestCase):
    url = reverse("progress-macros")

    def test_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_own_logs_oldest_first_without_pagination(self):
        today = timezone.localdate()
        for days_ago in range(25):
            DailyMacro.objects.create(
                user=self.user, date=today - timedelta(days=days_ago), calories=2000 + days_ago
            )
        DailyMacro.objects.create(user=self.other_user, date=today, calories=9999)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        dates = [point["date"] for point in response.data]
        self.assertEqual(len(dates), 25)
        self.assertEqual(dates, sorted(dates))
        self.assertNotIn(9999, [point["calories"] for point in response.data])

    def test_days_parameter_limits_the_range(self):
        today = timezone.localdate()
        DailyMacro.objects.create(user=self.user, date=today - timedelta(days=5), calories=2400)
        DailyMacro.objects.create(user=self.user, date=today - timedelta(days=60), calories=2200)

        response = self.client.get(self.url, {"days": 30})

        self.assertEqual([point["calories"] for point in response.data], [2400])
