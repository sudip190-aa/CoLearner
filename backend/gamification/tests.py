from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from community.models import Thread
from gamification.models import Badge, UserBadge, XPEvent
from gamification.services import award_xp, check_badges, update_streak

User = get_user_model()


class GamificationEngineTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="engine-user@example.com",
            username="engineuser",
            full_name="Engine User",
            password="StrongPassword123!",
        )

    def test_level_formula(self):
        self.user.xp = 0
        self.user.save(update_fields=["xp"])

        award_xp(self.user, "custom", 250, source="manual")
        self.user.refresh_from_db()

        self.assertEqual(self.user.level, 3)
        self.assertEqual(self.user.xp, 250)

    def test_badge_idempotency(self):
        badge = Badge.objects.create(
            name="First Thread",
            slug="first-thread",
            criteria_key="first_thread",
            xp_reward=25,
        )
        Thread.objects.create(author=self.user, title="My first thread", body="Hello thread", category="community")

        check_badges(self.user)
        check_badges(self.user)

        self.assertEqual(UserBadge.objects.filter(user=self.user, badge=badge).count(), 1)
        self.assertEqual(self.user.xp, 25)
        self.assertEqual(XPEvent.objects.filter(user=self.user, reason="first_thread").count(), 1)

    def test_streak_edges(self):
        self.user.last_active = timezone.now() - timedelta(days=1)
        self.user.streak_days = 6
        self.user.save(update_fields=["last_active", "streak_days"])

        update_streak(self.user)
        self.user.refresh_from_db()
        self.assertEqual(self.user.streak_days, 7)

        self.user.last_active = timezone.now() - timedelta(days=3)
        self.user.save(update_fields=["last_active"])
        update_streak(self.user)
        self.user.refresh_from_db()
        self.assertEqual(self.user.streak_days, 1)
