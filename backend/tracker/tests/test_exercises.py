from django.urls import reverse
from rest_framework import status

from tracker.models import Exercise, SetEntry, Workout

from .helpers import TwoUserAPITestCase


class ExerciseApiTests(TwoUserAPITestCase):
    list_url = reverse("exercise-list")

    def test_list_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_sets_owner_to_current_user(self):
        response = self.client.post(self.list_url, {"name": "Bench Press", "category": "push"})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Exercise.objects.get().owner, self.user)

    def test_list_only_returns_own_exercises(self):
        Exercise.objects.create(owner=self.user, name="Squat")
        Exercise.objects.create(owner=self.other_user, name="Deadlift")
        Exercise.objects.create(owner=None, name="Legacy exercise")

        response = self.client.get(self.list_url)

        names = [exercise["name"] for exercise in response.data]
        self.assertEqual(names, ["Squat"])

    def test_list_is_not_paginated_and_sorted_by_name(self):
        for number in range(25):
            Exercise.objects.create(owner=self.user, name=f"Exercise {number:02d}")

        response = self.client.get(self.list_url)

        names = [exercise["name"] for exercise in response.data]
        self.assertEqual(len(names), 25)
        self.assertEqual(names, sorted(names))

    def test_cannot_read_another_users_exercise(self):
        other = Exercise.objects.create(owner=self.other_user, name="Deadlift")

        response = self.client.get(reverse("exercise-detail", args=[other.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_duplicate_name_for_same_user_is_rejected(self):
        Exercise.objects.create(owner=self.user, name="Squat")

        response = self.client.post(self.list_url, {"name": "squat", "category": "legs"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", response.data)

    def test_two_users_can_use_the_same_name(self):
        Exercise.objects.create(owner=self.other_user, name="Squat")

        response = self.client.post(self.list_url, {"name": "Squat", "category": "legs"})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_rename_exercise(self):
        exercise = Exercise.objects.create(owner=self.user, name="Sqat", category="other")

        response = self.client.patch(
            reverse("exercise-detail", args=[exercise.id]), {"name": "Squat", "category": "legs"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        exercise.refresh_from_db()
        self.assertEqual(exercise.name, "Squat")
        self.assertEqual(exercise.category, "legs")

    def test_saving_an_exercise_with_its_current_name_is_allowed(self):
        exercise = Exercise.objects.create(owner=self.user, name="Squat")

        response = self.client.patch(
            reverse("exercise-detail", args=[exercise.id]), {"name": "Squat", "category": "legs"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_rename_to_an_existing_name_is_rejected(self):
        Exercise.objects.create(owner=self.user, name="Squat")
        exercise = Exercise.objects.create(owner=self.user, name="Deadlift")

        response = self.client.patch(
            reverse("exercise-detail", args=[exercise.id]), {"name": "Squat"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_category_is_rejected(self):
        response = self.client.post(self.list_url, {"name": "Squat", "category": "arms"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("category", response.data)

    def test_delete_unused_exercise(self):
        exercise = Exercise.objects.create(owner=self.user, name="Squat")

        response = self.client.delete(reverse("exercise-detail", args=[exercise.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Exercise.objects.filter(id=exercise.id).exists())

    def test_delete_exercise_with_logged_sets_returns_conflict(self):
        exercise = Exercise.objects.create(owner=self.user, name="Squat")
        workout = Workout.objects.create(user=self.user, date="2026-10-01")
        SetEntry.objects.create(workout=workout, exercise=exercise, reps=5)

        response = self.client.delete(reverse("exercise-detail", args=[exercise.id]))

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("detail", response.data)
        self.assertTrue(Exercise.objects.filter(id=exercise.id).exists())

    def test_cannot_update_or_delete_another_users_exercise(self):
        other = Exercise.objects.create(owner=self.other_user, name="Deadlift")
        url = reverse("exercise-detail", args=[other.id])

        self.assertEqual(
            self.client.patch(url, {"name": "Hacked"}).status_code, status.HTTP_404_NOT_FOUND
        )
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)
        other.refresh_from_db()
        self.assertEqual(other.name, "Deadlift")
