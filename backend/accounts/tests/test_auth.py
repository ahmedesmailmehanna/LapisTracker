from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

User = get_user_model()

STRONG_PASSWORD = "correct-horse-battery-staple"


class RegisterTests(APITestCase):
    url = reverse("auth-register")

    def test_register_creates_user_and_returns_token(self):
        response = self.client.post(
            self.url,
            {"username": "ahmed", "email": "ahmed@example.com", "password": STRONG_PASSWORD},
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="ahmed")
        self.assertEqual(response.data["token"], Token.objects.get(user=user).key)
        self.assertEqual(response.data["user"]["username"], "ahmed")
        self.assertNotIn("password", response.data["user"])

    def test_password_is_stored_hashed(self):
        self.client.post(self.url, {"username": "ahmed", "password": STRONG_PASSWORD})

        user = User.objects.get(username="ahmed")
        self.assertNotEqual(user.password, STRONG_PASSWORD)
        self.assertTrue(user.check_password(STRONG_PASSWORD))

    def test_duplicate_username_is_rejected(self):
        User.objects.create_user(username="ahmed", password=STRONG_PASSWORD)

        response = self.client.post(self.url, {"username": "Ahmed", "password": STRONG_PASSWORD})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

    def test_weak_password_is_rejected(self):
        response = self.client.post(self.url, {"username": "ahmed", "password": "12345"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertFalse(User.objects.filter(username="ahmed").exists())

    @override_settings(ALLOW_REGISTRATION=False)
    def test_registration_can_be_disabled(self):
        response = self.client.post(self.url, {"username": "ahmed", "password": STRONG_PASSWORD})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(User.objects.exists())


class LoginTests(APITestCase):
    url = reverse("auth-login")

    def setUp(self):
        self.user = User.objects.create_user(username="ahmed", password=STRONG_PASSWORD)

    def test_login_returns_token(self):
        response = self.client.post(self.url, {"username": "ahmed", "password": STRONG_PASSWORD})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["token"], Token.objects.get(user=self.user).key)

    def test_login_with_wrong_password_fails(self):
        response = self.client.post(self.url, {"username": "ahmed", "password": "wrong"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertNotIn("token", response.data)

    def test_login_with_unknown_user_gives_same_error(self):
        wrong_password = self.client.post(self.url, {"username": "ahmed", "password": "wrong"})
        unknown_user = self.client.post(self.url, {"username": "nobody", "password": "wrong"})

        self.assertEqual(unknown_user.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(unknown_user.data, wrong_password.data)


class LogoutAndMeTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ahmed", password=STRONG_PASSWORD)
        self.token = Token.objects.create(user=self.user)

    def authenticate(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_me_requires_a_token(self):
        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_the_current_user(self):
        self.authenticate()

        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "ahmed")

    def test_logout_deletes_the_token(self):
        self.authenticate()

        response = self.client.post(reverse("auth-logout"))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_token_no_longer_works_after_logout(self):
        self.authenticate()
        self.client.post(reverse("auth-logout"))

        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
