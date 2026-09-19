import re

from rest_framework import serializers

from .models import Comment, Tag, Thread

MAX_TAGS = 5
TAG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9+#._-]{0,29}$")


def avatar_url(user, request):
    """Absolute URL (the SPA runs on another origin, so a relative /media/... path would 404)."""
    if not user.avatar:
        return None
    return request.build_absolute_uri(user.avatar.url) if request else user.avatar.url


def author_payload(user, request):
    return {"id": user.id, "username": user.username, "full_name": user.full_name, "avatar": avatar_url(user, request)}


class ThreadSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    vote_score = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = (
            "id",
            "slug",
            "title",
            "body",
            "category",
            "is_pinned",
            "views",
            "tags",
            "author",
            "vote_score",
            "comment_count",
            "user_vote",
            "created_at",
            "updated_at",
        )

    def get_author(self, obj):
        return author_payload(obj.author, self.context.get("request"))

    # The list view annotates these in one query; single objects fall back to a query each.
    def get_vote_score(self, obj):
        if hasattr(obj, "vote_score"):
            return int(obj.vote_score or 0)
        from .views import vote_total

        return vote_total(obj)

    def get_comment_count(self, obj):
        return obj.comment_count if hasattr(obj, "comment_count") else obj.comments.count()

    def get_tags(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def get_user_vote(self, obj):
        if hasattr(obj, "user_vote"):
            return int(obj.user_vote or 0)
        from .views import user_vote_for

        request = self.context.get("request")
        return user_vote_for(request.user if request else None, obj)


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    vote_score = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ("id", "thread", "parent", "author", "body", "vote_score", "user_vote", "replies", "created_at", "updated_at")

    def get_author(self, obj):
        return author_payload(obj.author, self.context.get("request"))

    def get_vote_score(self, obj):
        if hasattr(obj, "vote_score"):
            return int(obj.vote_score or 0)
        from .views import vote_total

        return vote_total(obj)

    def get_user_vote(self, obj):
        if hasattr(obj, "user_vote"):
            return int(obj.user_vote or 0)
        from .views import user_vote_for

        request = self.context.get("request")
        return user_vote_for(request.user if request else None, obj)

    def get_replies(self, obj):
        # Replies are attached by the detail view (one level deep); a bare comment has none.
        return getattr(obj, "reply_list", [])


class TagSerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ("id", "slug", "name", "color", "count")

    def get_count(self, obj):
        return obj.thread_count if hasattr(obj, "thread_count") else obj.threads.count()


class ThreadWriteSerializer(serializers.ModelSerializer):
    """Create and edit. Tags are replaced as a whole when supplied."""

    tags = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)
    title = serializers.CharField(min_length=3, max_length=200)
    body = serializers.CharField(min_length=10, max_length=20000)

    class Meta:
        model = Thread
        fields = ("title", "body", "category", "tags")

    def validate_tags(self, raw):
        cleaned = []
        for item in raw:
            name = item.strip().lstrip("#").lower()
            if not name:
                continue
            if not TAG_PATTERN.match(name):
                raise serializers.ValidationError(f'"{item}" is not a valid tag (letters, numbers and + # . _ - only, up to 30 characters).')
            if name not in cleaned:
                cleaned.append(name)
        if len(cleaned) > MAX_TAGS:
            raise serializers.ValidationError(f"Use at most {MAX_TAGS} tags.")
        return cleaned

    @staticmethod
    def _apply_tags(thread, names):
        thread.tags.set([Tag.objects.get_or_create(name=name)[0] for name in names])

    def create(self, validated_data):
        names = validated_data.pop("tags", [])
        thread = Thread.objects.create(**validated_data)
        self._apply_tags(thread, names)
        return thread

    def update(self, instance, validated_data):
        names = validated_data.pop("tags", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if names is not None:
            self._apply_tags(instance, names)
        return instance
