from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from tracker.models import DailyMacro, Exercise, Workout

User = get_user_model()


class ClaimUnownedDataTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(username="ahmed")
        self.other_user = User.objects.create(username="omar")

    def run_command(self, username):
        out = StringIO()
        call_command("claim_unowned_data", username, stdout=out)
        return out.getvalue()

    def test_assigns_unowned_rows_to_the_user(self):
        workout = Workout.objects.create(user=None, date="2026-09-12")
        macro = DailyMacro.objects.create(user=None, date="2026-09-12", calories=2400)
        exercise = Exercise.objects.create(owner=None, name="Squat")

        self.run_command("ahmed")

        workout.refresh_from_db()
        macro.refresh_from_db()
        exercise.refresh_from_db()
        self.assertEqual(workout.user, self.user)
        self.assertEqual(macro.user, self.user)
        self.assertEqual(exercise.owner, self.user)

    def test_does_not_touch_rows_that_already_have_an_owner(self):
        workout = Workout.objects.create(user=self.other_user, date="2026-09-12")

        self.run_command("ahmed")

        workout.refresh_from_db()
        self.assertEqual(workout.user, self.other_user)

    def test_skips_rows_that_would_break_a_unique_constraint(self):
        DailyMacro.objects.create(user=self.user, date="2026-09-12", calories=2000)
        orphan = DailyMacro.objects.create(user=None, date="2026-09-12", calories=2400)

        output = self.run_command("ahmed")

        orphan.refresh_from_db()
        self.assertIsNone(orphan.user)
        self.assertIn("Skipped 1", output)

    def test_unknown_username_is_an_error(self):
        with self.assertRaises(CommandError):
            self.run_command("nobody")
