from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import RestrictedError
from django.test import TestCase

from tracker.models import DailyMacro, Exercise, SetEntry, Workout

User = get_user_model()


class ModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create(username="ahmed")
        self.other_user = User.objects.create(username="omar")


class StringRepresentationTests(ModelTestCase):
    def test_exercise(self):
        self.assertEqual(str(Exercise(name="Squat")), "Squat")

    def test_workout(self):
        workout = Workout(date="2026-10-01", workout_type="hiit")
        self.assertEqual(str(workout), "HIIT workout on 2026-10-01")

    def test_set_entry(self):
        entry = SetEntry(exercise=Exercise(name="Squat"), reps=5, weight_kg=100)
        self.assertEqual(str(entry), "Squat: 5 x 100kg")

    def test_daily_macro(self):
        log = DailyMacro(date="2026-10-01", calories=2400)
        self.assertEqual(str(log), "Macros for 2026-10-01: 2400 kcal")


class DatabaseConstraintTests(ModelTestCase):
    """The serializers validate these rules, but the database enforces them
    too, so they hold even for code that bypasses the API."""

    def test_exercise_name_is_unique_per_owner(self):
        Exercise.objects.create(owner=self.user, name="Squat")

        # transaction.atomic() lets the test continue after the expected error.
        with self.assertRaises(IntegrityError), transaction.atomic():
            Exercise.objects.create(owner=self.user, name="Squat")

        Exercise.objects.create(owner=self.other_user, name="Squat")  # no error

    def test_one_macro_log_per_user_per_day(self):
        DailyMacro.objects.create(user=self.user, date="2026-10-01", calories=2400)

        with self.assertRaises(IntegrityError), transaction.atomic():
            DailyMacro.objects.create(user=self.user, date="2026-10-01", calories=2000)

        DailyMacro.objects.create(user=self.other_user, date="2026-10-01", calories=2000)


class DeletionBehaviourTests(ModelTestCase):
    def setUp(self):
        super().setUp()
        self.exercise = Exercise.objects.create(owner=self.user, name="Squat")
        self.workout = Workout.objects.create(user=self.user, date="2026-10-01")
        self.entry = SetEntry.objects.create(workout=self.workout, exercise=self.exercise, reps=5)

    def test_deleting_a_workout_deletes_its_sets(self):
        self.workout.delete()

        self.assertFalse(SetEntry.objects.filter(id=self.entry.id).exists())
        self.assertTrue(Exercise.objects.filter(id=self.exercise.id).exists())

    def test_exercise_with_sets_cannot_be_deleted_on_its_own(self):
        with self.assertRaises(RestrictedError):
            self.exercise.delete()

    def test_deleting_a_user_deletes_all_their_data(self):
        DailyMacro.objects.create(user=self.user, date="2026-10-01", calories=2400)

        self.user.delete()

        self.assertEqual(Workout.objects.count(), 0)
        self.assertEqual(SetEntry.objects.count(), 0)
        self.assertEqual(Exercise.objects.count(), 0)
        self.assertEqual(DailyMacro.objects.count(), 0)


class DefaultOrderingTests(ModelTestCase):
    def test_workouts_are_newest_first(self):
        Workout.objects.create(user=self.user, date="2026-10-01")
        Workout.objects.create(user=self.user, date="2026-10-03")
        Workout.objects.create(user=self.user, date="2026-10-02")

        dates = [str(workout.date) for workout in Workout.objects.all()]

        self.assertEqual(dates, ["2026-10-03", "2026-10-02", "2026-10-01"])

    def test_sets_follow_their_order_field(self):
        exercise = Exercise.objects.create(owner=self.user, name="Squat")
        workout = Workout.objects.create(user=self.user, date="2026-10-01")
        SetEntry.objects.create(workout=workout, exercise=exercise, reps=3, order=2)
        SetEntry.objects.create(workout=workout, exercise=exercise, reps=5, order=1)

        reps = [entry.reps for entry in workout.sets.all()]

        self.assertEqual(reps, [5, 3])
