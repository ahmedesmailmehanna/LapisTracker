from django.urls import reverse
from rest_framework import status

from tracker.models import Exercise

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

        names = [exercise["name"] for exercise in response.data["results"]]
        self.assertEqual(names, ["Squat"])

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
