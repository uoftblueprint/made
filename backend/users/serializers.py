from rest_framework import serializers
from .models import VolunteerApplication


class VolunteerApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for the VolunteerApplication model.
    Handles creating new volunteer applications upon submission.
    """

    reviewed_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = VolunteerApplication
        fields = [
            'id', 
            'name', 
            'email', 
            'motivation_text', 
            'status', 
            'created_at',
            'reviewed_at',
            'reviewed_by'
            ]
        read_only_fields = ['id', 'created_at', 'reviewed_at', 'reviewed_by']
    
    def create(self, validated_data):
        """Create a new volunteer application with PENDING status."""
        validated_data['status'] = 'PENDING'
        return super().create(validated_data)

