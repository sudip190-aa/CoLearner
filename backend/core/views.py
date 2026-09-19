from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


from .serializers import ContactMessageSerializer
from .throttles import ContactRateThrottle


@extend_schema(responses=OpenApiTypes.OBJECT)
@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response(
        {
            "status": "ok",
            "service": "Colearn",
            "environment": "development" if settings.DEBUG else "production",
        }
    )


class ContactAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ContactRateThrottle]

    @extend_schema(operation_id='core_contact_post', request=ContactMessageSerializer, responses={201: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Thanks, we've received your message."}, status=status.HTTP_201_CREATED)
