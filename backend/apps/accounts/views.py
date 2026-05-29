# Create your views here.
import logging
import random

from datetime import timedelta
from django.utils import timezone

from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import update_session_auth_hash
from django.core.mail import get_connection, send_mail
from django.conf import settings
from .models import User, PasswordResetCode
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    UpdateProfileSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "user": UserSerializer(user).data,
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "user": UserSerializer(user).data,
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"message": "Successfully logged out"}, status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UpdateProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            user = User.objects.filter(email=email).first()
            debug_token = None
            if user:
                verification_code = str(random.SystemRandom().randint(100000, 999999))
                frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
                reset_link = f"{frontend_url.rstrip('/')}/reset-password"
                subject = "Reset your ElectroMerce password"
                message = (
                    f"Hello {user.username},\n\n"
                    "You requested a password reset for ElectroMerce.\n\n"
                    f"Your verification code is:\n\n"
                    f"{verification_code}\n\n"
                    "This code expires in 1 minute.\n\n"
                    "If your email client supports links, you can also open this URL:\n"
                    f"{reset_link}\n\n"
                    f"This email was sent by {settings.SUPPORT_EMAIL}.\n\n"
                    "If you did not request this change, please ignore this message.\n"
                )
                from_email = settings.DEFAULT_FROM_EMAIL
                sent_successfully = False
                fallback_console = False
                debug_token = verification_code if settings.DEBUG else None
                connection = get_connection()

                try:
                    PasswordResetCode.objects.filter(user=user, is_used=False).update(is_used=True)
                    PasswordResetCode.objects.create(user=user, code=verification_code)
                    send_mail(
                        subject,
                        message,
                        from_email,
                        [user.email],
                        connection=connection,
                    )
                    sent_successfully = True
                except Exception:
                    logging.getLogger(__name__).exception(
                        "Password reset email failed to send for %s", email
                    )
                    if settings.DEBUG:
                        try:
                            fallback_connection = get_connection(
                                "django.core.mail.backends.console.EmailBackend"
                            )
                            send_mail(
                                subject,
                                message,
                                from_email,
                                [user.email],
                                connection=fallback_connection,
                            )
                            fallback_console = True
                            sent_successfully = True
                            logging.getLogger(__name__).info(
                                "Password reset email written to console for %s", email
                            )
                        except Exception:
                            logging.getLogger(__name__).exception(
                                "Console email fallback also failed for %s", email
                            )

                if sent_successfully:
                    response_data = {
                        "message": "If an account with that email exists, a password reset email has been sent."
                    }
                    if fallback_console and debug_token:
                        response_data["debug_token"] = debug_token
                    return Response(response_data, status=status.HTTP_202_ACCEPTED if fallback_console else status.HTTP_200_OK)

                # Keep the endpoint stable even when email delivery fails.
                response_data = {
                    "message": "If an account with that email exists, a password reset request has been received." 
                               "If email delivery is temporarily unavailable, try again later."
                }
                if debug_token:
                    response_data["debug_token"] = debug_token
                return Response(response_data)

            return Response(
                {
                    "message": "If an account with that email exists, a password reset email has been sent."
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            token = serializer.validated_data["token"]
            new_password = serializer.validated_data["new_password"]
            user = User.objects.filter(email=email).first()
            if not user:
                return Response(
                    {"token": "Invalid email or reset code."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            code_record = PasswordResetCode.objects.filter(
                user=user,
                code=token,
                is_used=False,
                created_at__gte=timezone.now() - timedelta(minutes=1),
            ).order_by("-created_at").first()

            if not code_record:
                return Response(
                    {"token": "Invalid email or reset code."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(new_password)
            user.save()
            code_record.is_used = True
            code_record.save()
            return Response({"message": "Password has been reset successfully."})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            if not request.user.check_password(serializer.data["old_password"]):
                return Response(
                    {"old_password": "Wrong password"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            request.user.set_password(serializer.data["new_password"])
            request.user.save()
            update_session_auth_hash(request, request.user)
            return Response({"message": "Password changed successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
