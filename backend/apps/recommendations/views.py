from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Interaction
from .algorithms import RecommendationEngine
from apps.products.serializers import ProductListSerializer
from apps.products.models import Product


class TrackInteractionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product_id")
        action = request.data.get("action")

        if not product_id or not action:
            return Response(
                {"error": "product_id and action are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = Product.objects.filter(id=product_id, is_active=True).first()
        if not product:
            return Response(
                {"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND
            )

        session_id = (
            getattr(request.session, "session_key", "") or ""
            if hasattr(request, "session") and request.session
            else ""
        )
        Interaction.objects.create(
            user=request.user,
            product=product,
            action=action,
            session_id=session_id,
        )

        return Response({"message": "Interaction tracked"})


class PersonalizedRecommendationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = int(request.query_params.get("limit", 10))

        recommendations = RecommendationEngine.get_user_based_recommendations(
            request.user, limit
        )

        serializer = ProductListSerializer(recommendations, many=True)
        return Response(serializer.data)


class RelatedProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        limit = int(request.query_params.get("limit", 8))

        recommendations = RecommendationEngine.get_related_products(product_id, limit)
        serializer = ProductListSerializer(recommendations, many=True)
        return Response(serializer.data)


class TrendingProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        limit = int(request.query_params.get("limit", 10))

        trending = RecommendationEngine.get_popular_products(limit)
        serializer = ProductListSerializer(trending, many=True)
        return Response(serializer.data)


class SimilarProductsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        limit = int(request.query_params.get("limit", 8))

        similar = RecommendationEngine.get_content_based_recommendations(
            product_id, limit
        )
        serializer = ProductListSerializer(similar, many=True)
        return Response(serializer.data)
