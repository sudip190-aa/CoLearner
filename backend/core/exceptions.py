from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    # get_object_or_404 raises Django's Http404 whose text names the internal model ("No CustomUser matches...").
    # Convert to DRF's own exceptions so clients get a stable code and a message that is safe to display.
    if isinstance(exc, Http404):
        exc = NotFound()
    elif isinstance(exc, DjangoPermissionDenied):
        exc = PermissionDenied()
    response = exception_handler(exc, context)

    if response is None:
        return Response(
            {
                "error": {
                    "code": getattr(exc, "default_code", "server_error"),
                    "message": str(exc),
                    "fields": {},
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    error_data = response.data
    payload = {
        "error": {
            "code": getattr(exc, "default_code", "error"),
            "message": "Request failed.",
            "fields": {},
        }
    }

    if isinstance(error_data, dict):
        if "detail" in error_data:
            payload["error"]["message"] = error_data["detail"]
        elif "non_field_errors" in error_data:
            payload["error"]["message"] = "; ".join(
                str(item) for item in error_data["non_field_errors"]
            )
        else:
            payload["error"]["fields"] = {
                key: value if isinstance(value, list) else [value]
                for key, value in error_data.items()
            }
            payload["error"]["message"] = "Validation failed."
    elif isinstance(error_data, list):
        payload["error"]["message"] = "; ".join(str(item) for item in error_data)

    response.data = payload
    return response
