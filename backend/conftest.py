import pytest


@pytest.fixture(scope="session")
def django_db_setup(django_db_setup, django_db_blocker):
    """The default badges ship in a data migration. Most tests count exact XP, so they start with no badges and
    create the ones they need; tests/test_gamification_flow.py covers the shipped set explicitly."""
    from gamification.models import Badge

    with django_db_blocker.unblock():
        Badge.objects.all().delete()


@pytest.fixture(autouse=True)
def _isolated_media_root(tmp_path, settings):
    """Uploads made by tests go to a throwaway folder, never into backend/media."""
    settings.MEDIA_ROOT = str(tmp_path / "media")
