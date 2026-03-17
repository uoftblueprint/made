import json

from django.test import TestCase, Client
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken

from users.models import User
from inventory.models import CollectionItem, Location, ItemHistory
from movements.models import ItemMovementRequest


class ItemMovementArrivalAPITest(TestCase):
    def setUp(self):
        self.volunteer = User.objects.create_user(
            email="volunteer-move@example.com",
            name="Volunteer Move",
            password="testpass",
            role="VOLUNTEER",
        )
        self.admin = User.objects.create_user(
            email="admin-move@example.com",
            name="Admin Move",
            password="testpass",
            role="ADMIN",
        )

        volunteer_token = AccessToken.for_user(self.volunteer)
        self.client = Client(HTTP_AUTHORIZATION=f"Bearer {volunteer_token}")

        self.from_location = Location.objects.create(name="Storage B", location_type="STORAGE")
        self.to_location = Location.objects.create(name="Event Hall", location_type="EVENT")

        self.item = CollectionItem.objects.create(
            item_code="MOVE001",
            title="Transit Test Item",
            current_location=self.from_location,
            status="AVAILABLE",
            is_on_floor=False,
        )

        self.move_request = ItemMovementRequest.objects.create(
            item=self.item,
            requested_by=self.volunteer,
            from_location=self.from_location,
            to_location=self.to_location,
        )

    def test_complete_arrival_updates_item_location_and_status(self):
        self.move_request.approve(admin_user=self.admin, comment="Approved")

        response = self.client.post(
            f"/api/movements/movement-requests/{self.move_request.id}/complete-arrival/",
            data=json.dumps({"comment": "Arrived and checked"}),
            content_type="application/json",
        )

        assert response.status_code == status.HTTP_200_OK
        self.item.refresh_from_db()
        assert self.item.current_location_id == self.to_location.id
        assert self.item.status == "AVAILABLE"

        assert ItemHistory.objects.filter(
            item=self.item,
            event_type="ARRIVED",
            to_location=self.to_location,
        ).exists()

    def test_complete_arrival_rejects_when_item_not_in_transit(self):
        self.move_request.status = "APPROVED"
        self.move_request.admin = self.admin
        self.move_request.admin_comment = "Approved"
        self.move_request.save(update_fields=["status", "admin", "admin_comment", "updated_at"])

        response = self.client.post(
            f"/api/movements/movement-requests/{self.move_request.id}/complete-arrival/",
            data=json.dumps({}),
            content_type="application/json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
