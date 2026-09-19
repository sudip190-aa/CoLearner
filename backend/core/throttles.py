from rest_framework.throttling import SimpleRateThrottle


class ContactRateThrottle(SimpleRateThrottle):
    """Per-IP limit for the public contact form, kept separate from the login bucket."""

    scope = "contact"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}
