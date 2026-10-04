from django.urls import reverse
from rest_framework import status

from tracker.models import Exercise, SetEntry, Workout

from .helpers import TwoUserAPITestCase


class WorkoutApiTests(TwoUserAPITestCase):
    list_url = reverse("workout-list")

    def test_list_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_sets_user_to_current_user(self):
        response = self.client.post(
            self.list_url, {"date": "2026-10-01", "workout_type": "strength"}
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Workout.objects.get().user, self.user)

    def test_user_field_in_request_body_is_ignored(self):
        self.client.post(
            self.list_url,
            {"date": "2026-10-01", "workout_type": "strength", "user": self.other_user.id},
        )

        self.assertEqual(Workout.objects.get().user, self.user)

    def test_list_only_returns_own_workouts(self):
        mine = Workout.objects.create(user=self.user, date="2026-10-01")
        Workout.objects.create(user=self.other_user, date="2026-10-02")
        Workout.objects.create(user=None, date="2026-10-03")

        response = self.client.get(self.list_url)

        ids = [workout["id"] for workout in response.data["results"]]
        self.assertEqual(ids, [mine.id])

    def test_cannot_read_update_or_delete_another_users_workout(self):
        other = Workout.objects.create(user=self.other_user, date="2026-10-02")
        url = reverse("workout-detail", args=[other.id])

        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            self.client.patch(url, {"notes": "hacked"}).status_code, status.HTTP_404_NOT_FOUND
        )
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Workout.objects.filter(id=other.id).exists())


    def test_workout_includes_its_sets_with_exercise_names(self):
        workout = Workout.objects.create(user=self.user, date="2026-10-01")
        exercise = Exercise.objects.create(owner=self.user, name="Squat")
        SetEntry.objects.create(workout=workout, exercise=exercise, reps=5, weight_kg="100")

        response = self.client.get(reverse("workout-detail", args=[workout.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["sets"]), 1)
        self.assertEqual(response.data["sets"][0]["exercise_name"], "Squat")
        self.assertEqual(response.data["sets"][0]["weight_kg"], "100.00")

    def test_update_own_workout(self):
        workout = Workout.objects.create(user=self.user, date="2026-10-01")

        response = self.client.patch(
            reverse("workout-detail", args=[workout.id]),
            {"workout_type": "cardio", "notes": "easy run"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        workout.refresh_from_db()
        self.assertEqual(workout.workout_type, "cardio")
        self.assertEqual(workout.notes, "easy run")

    def test_delete_own_workout(self):
        workout = Workout.objects.create(user=self.user, date="2026-10-01")

        response = self.client.delete(reverse("workout-detail", args=[workout.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Workout.objects.filter(id=workout.id).exists())

    def test_invalid_workout_type_is_rejected(self):
        response = self.client.post(
            self.list_url, {"date": "2026-10-01", "workout_type": "yoga"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("workout_type", response.data)

    def test_date_is_required(self):
        response = self.client.post(self.list_url, {"workout_type": "strength"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date", response.data)

    def test_list_is_paginated(self):
        for day in range(1, 26):
            Workout.objects.create(user=self.user, date=f"2026-09-{day:02d}")

        response = self.client.get(self.list_url)

        self.assertEqual(response.data["count"], 25)
        self.assertEqual(len(response.data["results"]), 20)
        self.assertIsNotNone(response.data["next"])


class SetEntryApiTests(TwoUserAPITestCase):
    list_url = reverse("setentry-list")

    def setUp(self):
        super().setUp()
        self.workout = Workout.objects.create(user=self.user, date="2026-10-01")
        self.exercise = Exercise.objects.create(owner=self.user, name="Squat")
        self.other_workout = Workout.objects.create(user=self.other_user, date="2026-10-01")
        self.other_exercise = Exercise.objects.create(owner=self.other_user, name="Squat")

    def test_create_set_on_own_workout(self):
        response = self.client.post(
            self.list_url,
            {"workout": self.workout.id, "exercise": self.exercise.id, "reps": 5, "weight_kg": "100"},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["exercise_name"], "Squat")

    def test_cannot_add_set_to_another_users_workout(self):
        response = self.client.post(
            self.list_url,
            {"workout": self.other_workout.id, "exercise": self.exercise.id, "reps": 5},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("workout", response.data)
        self.assertEqual(SetEntry.objects.count(), 0)

    def test_cannot_use_another_users_exercise(self):
        response = self.client.post(
            self.list_url,
            {"workout": self.workout.id, "exercise": self.other_exercise.id, "reps": 5},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("exercise", response.data)

    def test_list_only_returns_sets_from_own_workouts(self):
        mine = SetEntry.objects.create(workout=self.workout, exercise=self.exercise, reps=5)
        SetEntry.objects.create(
            workout=self.other_workout, exercise=self.other_exercise, reps=8
        )

        response = self.client.get(self.list_url)

        ids = [entry["id"] for entry in response.data["results"]]
        self.assertEqual(ids, [mine.id])

    def test_cannot_delete_another_users_set(self):
        other_set = SetEntry.objects.create(
            workout=self.other_workout, exercise=self.other_exercise, reps=8
        )

        response = self.client.delete(reverse("setentry-detail", args=[other_set.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(SetEntry.objects.filter(id=other_set.id).exists())

    def test_negative_reps_are_rejected(self):
        response = self.client.post(
            self.list_url,
            {"workout": self.workout.id, "exercise": self.exercise.id, "reps": -1},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reps", response.data)

    def test_cannot_move_a_set_to_another_users_workout(self):
        entry = SetEntry.objects.create(workout=self.workout, exercise=self.exercise, reps=5)

        response = self.client.patch(
            reverse("setentry-detail", args=[entry.id]), {"workout": self.other_workout.id}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        entry.refresh_from_db()
        self.assertEqual(entry.workout, self.workout)
