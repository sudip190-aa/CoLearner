from rest_framework import serializers

from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ("name", "email", "subject", "message")
        # CharField trims and rejects whitespace-only input by default.
        extra_kwargs = {"message": {"min_length": 10, "max_length": 5000}}
