from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

User = get_user_model()


class TwoUserAPITestCase(APITestCase):
    """Base class: two users, with the test client logged in as the first.

    force_authenticate skips the token lookup so these tests focus on what a
    logged-in user may see and do. The token flow itself is tested in
    accounts/tests.
    """

    def setUp(self):
        self.user = User.objects.create(username="ahmed")
        self.other_user = User.objects.create(username="omar")
        self.client.force_authenticate(user=self.user)
