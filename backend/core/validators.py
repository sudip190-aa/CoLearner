import os

from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator

MAX_AVATAR_SIZE = 2 * 1024 * 1024
MAX_COVER_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def _validate_image_upload(file, max_size_bytes, label="image"):
    if file is None:
        return
    if file.size > max_size_bytes:
        raise ValidationError(f"{label.capitalize()} files must be smaller than {max_size_bytes // (1024 * 1024)}MB.")
    extension = os.path.splitext(file.name)[1].lower().lstrip(".")
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError("Unsupported file type. Use JPG, JPEG, PNG, or WebP images only.")


def validate_avatar_upload(file):
    _validate_image_upload(file, MAX_AVATAR_SIZE, label="avatar")


def validate_cover_upload(file):
    _validate_image_upload(file, MAX_COVER_SIZE, label="cover")


avatar_extension_validator = FileExtensionValidator(ALLOWED_IMAGE_EXTENSIONS)
cover_extension_validator = FileExtensionValidator(ALLOWED_IMAGE_EXTENSIONS)
