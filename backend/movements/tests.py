import json

from django.test import TestCase, Client
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken

from users.models import User
from inventory.models import CollectionItem, Location, Box, ItemHistory
from movements.models import ItemMovementRequest, BoxMovementRequest


class MovementFlowTestMixin:
    """Shared setup for movement tests."""

    def setUp(self):
        self.junior = User.objects.create_user(
            email="junior@test.com", name="Junior Vol", password="pass",
            role="VOLUNTEER", requires_move_approval=True,
        )
        self.senior = User.objects.create_user(
            email="senior@test.com", name="Senior Vol", password="pass",
            role="VOLUNTEER", requires_move_approval=False,
        )
        self.admin = User.objects.create_user(
            email="admin@test.com", name="Admin User", password="pass",
            role="ADMIN", requires_move_approval=False,
        )

        self.loc_a = Location.objects.create(name="Storage A", location_type="STORAGE")
        self.loc_b = Location.objects.create(name="Floor B", location_type="FLOOR")

        self.item = CollectionItem.objects.create(
            item_code="TEST001", title="Test Item",
            current_location=self.loc_a, status="AVAILABLE", is_verified=True,
        )

        self.box = Box.objects.create(
            box_code="BOX-T01", label="Test Box", location=self.loc_a,
        )
        self.box_item = CollectionItem.objects.create(
            item_code="TEST002", title="Box Item",
            current_location=self.loc_a, status="AVAILABLE",
            is_verified=True, box=self.box,
        )

    def auth_client(self, user):
        token = AccessToken.for_user(user)
        return Client(HTTP_AUTHORIZATION=f"Bearer {token}")


class ItemMovementFlowTest(MovementFlowTestMixin, TestCase):
    """Test the full item movement flow: create → approve → arrive → verify."""

    def test_junior_creates_request_pending_approval(self):
        client = self.auth_client(self.junior)
        resp = client.post("/api/movements/movement-requests/", json.dumps({
            "item": self.item.id,
            "from_location": self.loc_a.id,
            "to_location": self.loc_b.id,
        }), content_type="application/json")

        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["status"], "WAITING_APPROVAL")
        # Item should still be available — not moved yet
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "AVAILABLE")

    def test_senior_creates_request_auto_in_transit(self):
        client = self.auth_client(self.senior)
        resp = client.post("/api/movements/movement-requests/", json.dumps({
            "item": self.item.id,
            "from_location": self.loc_a.id,
            "to_location": self.loc_b.id,
        }), content_type="application/json")

        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["status"], "COMPLETED_UNVERIFIED")
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "IN_TRANSIT")
        self.assertFalse(self.item.is_verified)
        # Location should NOT be updated yet
        self.assertEqual(self.item.current_location_id, self.loc_a.id)

    def test_admin_creates_request_auto_in_transit(self):
        client = self.auth_client(self.admin)
        resp = client.post("/api/movements/movement-requests/", json.dumps({
            "item": self.item.id,
            "from_location": self.loc_a.id,
            "to_location": self.loc_b.id,
        }), content_type="application/json")

        self.assertEqual(resp.status_code, 201)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "IN_TRANSIT")
        self.assertEqual(self.item.current_location_id, self.loc_a.id)

    def test_approve_sets_in_transit(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
        )
        client = self.auth_client(self.senior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/approve/",
                           json.dumps({}), content_type="application/json")

        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "IN_TRANSIT")
        self.assertFalse(self.item.is_verified)
        self.assertEqual(self.item.current_location_id, self.loc_a.id)

    def test_complete_arrival_updates_location(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.senior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="COMPLETED_UNVERIFIED",
        )
        self.item.status = "IN_TRANSIT"
        self.item.is_verified = False
        self.item.save()

        client = self.auth_client(self.senior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/complete-arrival/",
                           json.dumps({}), content_type="application/json")

        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_location_id, self.loc_b.id)
        self.assertEqual(self.item.status, "AVAILABLE")
        self.assertFalse(self.item.is_verified)

    def test_verify_sets_verified(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.senior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="COMPLETED_UNVERIFIED",
        )
        self.item.status = "AVAILABLE"
        self.item.is_verified = False
        self.item.current_location = self.loc_b
        self.item.save()

        client = self.auth_client(self.admin)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/verify/",
                           json.dumps({}), content_type="application/json")

        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertTrue(self.item.is_verified)
        self.assertEqual(self.item.status, "AVAILABLE")

    def test_junior_cannot_approve(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
        )
        client = self.auth_client(self.junior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/approve/",
                           json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 403)

    def test_junior_cannot_verify(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.senior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="COMPLETED_UNVERIFIED",
        )
        client = self.auth_client(self.junior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/verify/",
                           json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 403)

    def test_senior_can_verify_own_move(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.senior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="COMPLETED_UNVERIFIED",
        )
        self.item.status = "AVAILABLE"
        self.item.is_verified = False
        self.item.save()

        client = self.auth_client(self.senior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/verify/",
                           json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertTrue(self.item.is_verified)

    def test_reject_keeps_item_unchanged(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
        )
        client = self.auth_client(self.admin)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/reject/",
                           json.dumps({}), content_type="application/json")

        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "AVAILABLE")
        self.assertEqual(self.item.current_location_id, self.loc_a.id)

    def test_mine_filter_returns_only_own_requests(self):
        ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
        )
        client = self.auth_client(self.senior)
        resp = client.get("/api/movements/movement-requests/?mine=true")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        results = data.get("results", data)
        self.assertEqual(len(results), 0)

    def test_serializer_includes_item_status(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.senior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="COMPLETED_UNVERIFIED",
        )
        self.item.status = "IN_TRANSIT"
        self.item.save()

        client = self.auth_client(self.senior)
        resp = client.get(f"/api/movements/movement-requests/{req.id}/")
        data = resp.json()
        self.assertEqual(data["item_status"], "IN_TRANSIT")
        self.assertEqual(data["requested_by_username"], "Senior Vol")


class BoxMovementFlowTest(MovementFlowTestMixin, TestCase):
    """Test the full box movement flow."""

    def test_senior_moves_box_items_go_in_transit(self):
        client = self.auth_client(self.senior)
        resp = client.post("/api/movements/box-movement-requests/", json.dumps({
            "box": self.box.id,
            "from_location": self.loc_a.id,
            "to_location": self.loc_b.id,
        }), content_type="application/json")

        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["status"], "COMPLETED_UNVERIFIED")
        self.assertEqual(data["items_status"], "IN_TRANSIT")
        self.box_item.refresh_from_db()
        self.assertEqual(self.box_item.status, "IN_TRANSIT")
        # Box location should NOT update yet
        self.box.refresh_from_db()
        self.assertEqual(self.box.location_id, self.loc_a.id)

    def test_box_arrival_updates_location(self):
        req = BoxMovementRequest.objects.create(
            box=self.box, requested_by=self.senior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="COMPLETED_UNVERIFIED",
        )
        self.box_item.status = "IN_TRANSIT"
        self.box_item.is_verified = False
        self.box_item.save()

        client = self.auth_client(self.senior)
        resp = client.post(f"/api/movements/box-movement-requests/{req.id}/complete-arrival/",
                           json.dumps({}), content_type="application/json")

        self.assertEqual(resp.status_code, 200)
        self.box.refresh_from_db()
        self.assertEqual(self.box.location_id, self.loc_b.id)
        self.box_item.refresh_from_db()
        self.assertEqual(self.box_item.status, "AVAILABLE")
        self.assertFalse(self.box_item.is_verified)

    def test_box_verify_sets_all_items_verified(self):
        req = BoxMovementRequest.objects.create(
            box=self.box, requested_by=self.senior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="COMPLETED_UNVERIFIED",
        )
        self.box_item.status = "AVAILABLE"
        self.box_item.is_verified = False
        self.box_item.save()

        client = self.auth_client(self.admin)
        resp = client.post(f"/api/movements/box-movement-requests/{req.id}/verify/",
                           json.dumps({}), content_type="application/json")

        self.assertEqual(resp.status_code, 200)
        self.box_item.refresh_from_db()
        self.assertTrue(self.box_item.is_verified)
        self.assertEqual(self.box_item.status, "AVAILABLE")

    def test_junior_cannot_verify_box(self):
        req = BoxMovementRequest.objects.create(
            box=self.box, requested_by=self.senior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="COMPLETED_UNVERIFIED",
        )
        client = self.auth_client(self.junior)
        resp = client.post(f"/api/movements/box-movement-requests/{req.id}/verify/",
                           json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 403)

    def test_serializer_returns_items_status_and_verified(self):
        req = BoxMovementRequest.objects.create(
            box=self.box, requested_by=self.senior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="COMPLETED_UNVERIFIED",
        )
        self.box_item.status = "IN_TRANSIT"
        self.box_item.is_verified = False
        self.box_item.save()

        client = self.auth_client(self.senior)
        resp = client.get(f"/api/movements/box-movement-requests/{req.id}/")
        data = resp.json()
        self.assertEqual(data["items_status"], "IN_TRANSIT")
        self.assertFalse(data["items_verified"])
        self.assertEqual(data["requested_by_username"], "Senior Vol")


class PermissionTest(MovementFlowTestMixin, TestCase):
    """Test role-based permissions for movement actions."""

    def test_senior_can_approve(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
        )
        client = self.auth_client(self.senior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/approve/",
                           json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)

    def test_senior_can_reject(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
        )
        client = self.auth_client(self.senior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/reject/",
                           json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)

    def test_anyone_can_mark_arrived(self):
        # Junior's own request, approved by admin
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="APPROVED", admin=self.admin,
        )
        self.item.status = "IN_TRANSIT"
        self.item.is_verified = False
        self.item.save()

        client = self.auth_client(self.junior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/complete-arrival/",
                           json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)

    def test_junior_sees_only_own_requests(self):
        ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.senior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="COMPLETED_UNVERIFIED",
        )
        client = self.auth_client(self.junior)
        resp = client.get("/api/movements/movement-requests/")
        results = resp.json().get("results", resp.json())
        self.assertEqual(len(results), 0)

    def test_senior_sees_all_requests(self):
        ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
        )
        client = self.auth_client(self.senior)
        resp = client.get("/api/movements/movement-requests/")
        results = resp.json().get("results", resp.json())
        self.assertGreaterEqual(len(results), 1)
