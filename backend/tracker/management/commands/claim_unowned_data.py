from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from tracker.models import DailyMacro, Exercise, Workout


class Command(BaseCommand):
    help = (
        "Assign workouts, macro logs and exercises that have no owner "
        "(created before authentication was added) to the given user."
    )

    def add_arguments(self, parser):
        parser.add_argument("username")

    def handle(self, *args, **options):
        User = get_user_model()
        try:
            user = User.objects.get(username=options["username"])
        except User.DoesNotExist:
            raise CommandError(f"No user named {options['username']!r}.")

        workouts = Workout.objects.filter(user__isnull=True).update(user=user)

        # Macro logs are unique per (user, date) and exercises per
        # (owner, name), so skip rows the user already has an equivalent of.
        taken_dates = DailyMacro.objects.filter(user=user).values("date")
        macros = (
            DailyMacro.objects.filter(user__isnull=True)
            .exclude(date__in=taken_dates)
            .update(user=user)
        )

        taken_names = Exercise.objects.filter(owner=user).values("name")
        exercises = (
            Exercise.objects.filter(owner__isnull=True)
            .exclude(name__in=taken_names)
            .update(owner=user)
        )

        skipped = (
            DailyMacro.objects.filter(user__isnull=True).count()
            + Exercise.objects.filter(owner__isnull=True).count()
        )
        self.stdout.write(
            f"Assigned to {user.username}: {workouts} workouts, "
            f"{macros} macro logs, {exercises} exercises."
        )
        if skipped:
            self.stdout.write(f"Skipped {skipped} rows that would duplicate existing ones.")
