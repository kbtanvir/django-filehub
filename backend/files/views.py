import hashlib
from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import File
from .serializers import FileSerializer
from django_filters import rest_framework as filters

# Create your views here.


class FileFilter(filters.FilterSet):
    original_filename = filters.CharFilter(lookup_expr='icontains')
    file_type = filters.CharFilter(lookup_expr='icontains')
    size_sort = filters.CharFilter(method='filter_by_size')
    uploaded_after = filters.DateTimeFilter(
        field_name='uploaded_at', lookup_expr='gte')
    uploaded_before = filters.DateTimeFilter(
        field_name='uploaded_at', lookup_expr='lte')

    class Meta:
        model = File
        fields = ['original_filename', 'file_type', 'size', 'uploaded_at']

    def filter_by_size(self, queryset, name, value):
        if value.lower() == 'asc':
            return queryset.order_by('size')
        elif value.lower() == 'desc':
            return queryset.order_by('-size')
        return queryset


class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = FileFilter
    queryset = File.objects.all()
    serializer_class = FileSerializer

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Compute file hash
        sha256 = hashlib.sha256()
        for chunk in file_obj.chunks():
            sha256.update(chunk)
        file_hash = sha256.hexdigest()

        # Check if file already exists
        existing_file = File.objects.filter(file_hash=file_hash).first()
        if existing_file:
            return Response({
                'error': 'File already exists',
                'existing_file_id': str(existing_file.id),
            }, status=status.HTTP_409_CONFLICT)

        data = {
            'file': file_obj,
            'original_filename': file_obj.name,
            'file_type': file_obj.content_type,
            'size': file_obj.size,
            'file_hash': file_hash,
        }

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
