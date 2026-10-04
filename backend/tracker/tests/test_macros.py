from django.urls import reverse
from rest_framework import status

from tracker.models import DailyMacro

from .helpers import TwoUserAPITestCase


class DailyMacroApiTests(TwoUserAPITestCase):
    list_url = reverse("dailymacro-list")
    payload = {"date": "2026-10-01", "calories": 2400, "protein_g": "180.0"}

    def test_list_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_sets_user_to_current_user(self):
        response = self.client.post(self.list_url, self.payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DailyMacro.objects.get().user, self.user)

    def test_list_only_returns_own_logs(self):
        mine = DailyMacro.objects.create(user=self.user, date="2026-10-01", calories=2400)
        DailyMacro.objects.create(user=self.other_user, date="2026-10-01", calories=1800)

        response = self.client.get(self.list_url)

        ids = [log["id"] for log in response.data["results"]]
        self.assertEqual(ids, [mine.id])

    def test_second_log_for_same_day_is_rejected(self):
        DailyMacro.objects.create(user=self.user, date="2026-10-01", calories=2400)

        response = self.client.post(self.list_url, self.payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date", response.data)

    def test_two_users_can_log_the_same_day(self):
        DailyMacro.objects.create(user=self.other_user, date="2026-10-01", calories=1800)

        response = self.client.post(self.list_url, self.payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_updating_a_log_keeps_its_own_date(self):
        log = DailyMacro.objects.create(user=self.user, date="2026-10-01", calories=2400)

        response = self.client.patch(
            reverse("dailymacro-detail", args=[log.id]), {"date": "2026-10-01", "calories": 2500}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_delete_another_users_log(self):
        other = DailyMacro.objects.create(user=self.other_user, date="2026-10-01", calories=1800)

        response = self.client.delete(reverse("dailymacro-detail", args=[other.id]))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(DailyMacro.objects.filter(id=other.id).exists())

    def test_moving_a_log_onto_an_existing_date_is_rejected(self):
        DailyMacro.objects.create(user=self.user, date="2026-10-01", calories=2400)
        log = DailyMacro.objects.create(user=self.user, date="2026-10-02", calories=2300)

        response = self.client.patch(
            reverse("dailymacro-detail", args=[log.id]), {"date": "2026-10-01"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date", response.data)

    def test_negative_calories_are_rejected(self):
        response = self.client.post(self.list_url, {"date": "2026-10-01", "calories": -100})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("calories", response.data)

    def test_list_is_newest_first(self):
        DailyMacro.objects.create(user=self.user, date="2026-10-01", calories=2400)
        DailyMacro.objects.create(user=self.user, date="2026-10-03", calories=2500)

        response = self.client.get(self.list_url)

        dates = [log["date"] for log in response.data["results"]]
        self.assertEqual(dates, ["2026-10-03", "2026-10-01"])
