from django.contrib.contenttypes.models import ContentType

from .models import Notification


def create_notification(user, actor, verb, target=None):
    if not user or (actor and actor == user):
        return None

    target_content_type = None
    object_id = None
    if target is not None:
        if hasattr(target, "_meta") and hasattr(target, "pk"):
            target_content_type = ContentType.objects.get_for_model(target.__class__)
            object_id = target.pk

    return Notification.objects.create(
        user=user,
        actor=actor,
        verb=verb,
        target_content_type=target_content_type,
        object_id=object_id,
    )
