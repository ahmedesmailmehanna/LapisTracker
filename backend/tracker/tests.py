from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Exercise


class ExerciseApiTests(APITestCase):
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
