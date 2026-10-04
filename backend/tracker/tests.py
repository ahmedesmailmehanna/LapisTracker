from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Exercise

User = get_user_model()


class ExerciseApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ahmed", password="pw-for-tests-123")
        # force_authenticate skips the token lookup; the auth flow itself is
        # covered in accounts/tests.
        self.client.force_authenticate(user=self.user)

    def test_list_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse("exercise-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_exercises_empty(self):
        response = self.client.get(reverse("exercise-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], [])

    def test_create_exercise(self):
        response = self.client.post(
            reverse("exercise-list"), {"name": "Bench Press", "category": "push"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Exercise.objects.count(), 1)
