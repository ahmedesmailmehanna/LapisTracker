import os
import subprocess
import sys
from pathlib import Path

from django.test import SimpleTestCase

from core.settings import env_list

BACKEND_DIR = Path(__file__).resolve().parent.parent


class EnvListTests(SimpleTestCase):
    def test_splits_on_commas_and_strips_spaces(self):
        os.environ["LAPIS_TEST_LIST"] = "a.example.com, b.example.com ,"
        self.addCleanup(os.environ.pop, "LAPIS_TEST_LIST")

        self.assertEqual(env_list("LAPIS_TEST_LIST"), ["a.example.com", "b.example.com"])

    def test_missing_variable_uses_default(self):
        self.assertEqual(env_list("LAPIS_TEST_MISSING", "x,y"), ["x", "y"])
        self.assertEqual(env_list("LAPIS_TEST_MISSING"), [])


class SecretKeyTests(SimpleTestCase):
    """Settings are evaluated at import time, so each case starts a fresh
    Python process with its own environment."""

    def load_settings(self, **overrides):
        env = {k: v for k, v in os.environ.items() if not k.startswith("DJANGO_")}
        env.update(overrides)
        return subprocess.run(
            [sys.executable, "-c", "import core.settings"],
            cwd=BACKEND_DIR,
            env=env,
            capture_output=True,
            text=True,
        )

    def test_production_refuses_to_start_without_a_secret_key(self):
        result = self.load_settings()

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("DJANGO_SECRET_KEY", result.stderr)

    def test_production_starts_with_a_secret_key(self):
        result = self.load_settings(DJANGO_SECRET_KEY="some-long-random-value")

        self.assertEqual(result.returncode, 0, result.stderr)

    def test_debug_mode_falls_back_to_a_dev_key(self):
        result = self.load_settings(DJANGO_DEBUG="1")

        self.assertEqual(result.returncode, 0, result.stderr)
