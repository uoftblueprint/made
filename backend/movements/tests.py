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


class JuniorFlowTest(MovementFlowTestMixin, TestCase):
    """Junior: Pending → Approved → Start Transit → Arrived → Verified"""

    def test_junior_creates_pending_request(self):
        client = self.auth_client(self.junior)
        resp = client.post("/api/movements/movement-requests/", json.dumps({
            "item": self.item.id,
            "from_location": self.loc_a.id,
            "to_location": self.loc_b.id,
        }), content_type="application/json")

        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["status"], "WAITING_APPROVAL")
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "AVAILABLE")  # unchanged

    def test_approve_does_not_set_in_transit(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
        )
        client = self.auth_client(self.senior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/approve/",
                           json.dumps({}), content_type="application/json")

        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "AVAILABLE")  # NOT in transit yet
        req.refresh_from_db()
        self.assertEqual(req.status, "APPROVED")

    def test_start_transit_sets_in_transit(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="APPROVED", admin=self.senior,
        )
        client = self.auth_client(self.junior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/start-transit/",
                           json.dumps({}), content_type="application/json")

        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "IN_TRANSIT")
        self.assertFalse(self.item.is_verified)
        self.assertEqual(self.item.current_location_id, self.loc_a.id)  # not moved yet

    def test_full_junior_flow(self):
        """Pending → Approve → Start Transit → Mark Arrived → Verify"""
        client_jr = self.auth_client(self.junior)
        client_sr = self.auth_client(self.senior)

        # 1. Junior creates request
        resp = client_jr.post("/api/movements/movement-requests/", json.dumps({
            "item": self.item.id, "from_location": self.loc_a.id, "to_location": self.loc_b.id,
        }), content_type="application/json")
        req_id = resp.json()["id"]

        # 2. Senior approves
        resp = client_sr.post(f"/api/movements/movement-requests/{req_id}/approve/",
                              json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "AVAILABLE")

        # 3. Junior starts transit
        resp = client_jr.post(f"/api/movements/movement-requests/{req_id}/start-transit/",
                              json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "IN_TRANSIT")

        # 4. Junior marks arrived
        resp = client_jr.post(f"/api/movements/movement-requests/{req_id}/complete-arrival/",
                              json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "AVAILABLE")
        self.assertEqual(self.item.current_location_id, self.loc_b.id)
        self.assertFalse(self.item.is_verified)

        # 5. Senior verifies
        resp = client_sr.post(f"/api/movements/movement-requests/{req_id}/verify/",
                              json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertTrue(self.item.is_verified)
        self.assertEqual(self.item.status, "AVAILABLE")

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


class SeniorFlowTest(MovementFlowTestMixin, TestCase):
    """Senior/Admin: Move → immediately In Transit → Arrived → Verified"""

    def test_senior_move_auto_in_transit(self):
        client = self.auth_client(self.senior)
        resp = client.post("/api/movements/movement-requests/", json.dumps({
            "item": self.item.id,
            "from_location": self.loc_a.id,
            "to_location": self.loc_b.id,
        }), content_type="application/json")

        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["status"], "COMPLETED_UNVERIFIED")
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "IN_TRANSIT")
        self.assertFalse(self.item.is_verified)

    def test_admin_move_auto_in_transit(self):
        client = self.auth_client(self.admin)
        resp = client.post("/api/movements/movement-requests/", json.dumps({
            "item": self.item.id,
            "from_location": self.loc_a.id,
            "to_location": self.loc_b.id,
        }), content_type="application/json")

        self.assertEqual(resp.status_code, 201)
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "IN_TRANSIT")

    def test_full_senior_flow(self):
        """Move → In Transit → Mark Arrived → Verify"""
        client_sr = self.auth_client(self.senior)

        # 1. Senior moves (auto in transit)
        resp = client_sr.post("/api/movements/movement-requests/", json.dumps({
            "item": self.item.id, "from_location": self.loc_a.id, "to_location": self.loc_b.id,
        }), content_type="application/json")
        req_id = resp.json()["id"]
        self.item.refresh_from_db()
        self.assertEqual(self.item.status, "IN_TRANSIT")

        # 2. Mark arrived
        resp = client_sr.post(f"/api/movements/movement-requests/{req_id}/complete-arrival/",
                              json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_location_id, self.loc_b.id)
        self.assertEqual(self.item.status, "AVAILABLE")
        self.assertFalse(self.item.is_verified)

        # 3. Verify
        resp = client_sr.post(f"/api/movements/movement-requests/{req_id}/verify/",
                              json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertTrue(self.item.is_verified)


class BoxMovementFlowTest(MovementFlowTestMixin, TestCase):
    """Box movement tests."""

    def test_senior_box_move_auto_in_transit(self):
        client = self.auth_client(self.senior)
        resp = client.post("/api/movements/box-movement-requests/", json.dumps({
            "box": self.box.id, "from_location": self.loc_a.id, "to_location": self.loc_b.id,
        }), content_type="application/json")

        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()["items_status"], "IN_TRANSIT")
        self.box_item.refresh_from_db()
        self.assertEqual(self.box_item.status, "IN_TRANSIT")
        self.box.refresh_from_db()
        self.assertEqual(self.box.location_id, self.loc_a.id)  # not moved yet

    def test_box_approve_does_not_set_in_transit(self):
        req = BoxMovementRequest.objects.create(
            box=self.box, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
        )
        client = self.auth_client(self.senior)
        resp = client.post(f"/api/movements/box-movement-requests/{req.id}/approve/",
                           json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.box_item.refresh_from_db()
        self.assertEqual(self.box_item.status, "AVAILABLE")  # NOT in transit

    def test_box_start_transit(self):
        req = BoxMovementRequest.objects.create(
            box=self.box, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="APPROVED", admin=self.senior,
        )
        client = self.auth_client(self.junior)
        resp = client.post(f"/api/movements/box-movement-requests/{req.id}/start-transit/",
                           json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        self.box_item.refresh_from_db()
        self.assertEqual(self.box_item.status, "IN_TRANSIT")

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

    def test_box_verify(self):
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


class PermissionTest(MovementFlowTestMixin, TestCase):
    """Role-based permission tests."""

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

    def test_junior_can_start_transit_own_approved(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="APPROVED", admin=self.senior,
        )
        client = self.auth_client(self.junior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/start-transit/",
                           json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)

    def test_junior_can_mark_arrived_own(self):
        req = ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="APPROVED", admin=self.senior,
        )
        self.item.status = "IN_TRANSIT"
        self.item.is_verified = False
        self.item.save()

        client = self.auth_client(self.junior)
        resp = client.post(f"/api/movements/movement-requests/{req.id}/complete-arrival/",
                           json.dumps({}), content_type="application/json")
        self.assertEqual(resp.status_code, 200)

    def test_senior_can_verify_own(self):
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

    def test_senior_sees_all_requests(self):
        ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
        )
        client = self.auth_client(self.senior)
        resp = client.get("/api/movements/movement-requests/")
        results = resp.json().get("results", resp.json())
        self.assertGreaterEqual(len(results), 1)

    def test_junior_sees_only_own(self):
        ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.senior,
            from_location=self.loc_a, to_location=self.loc_b,
            status="COMPLETED_UNVERIFIED",
        )
        client = self.auth_client(self.junior)
        resp = client.get("/api/movements/movement-requests/")
        results = resp.json().get("results", resp.json())
        self.assertEqual(len(results), 0)

    def test_mine_filter(self):
        ItemMovementRequest.objects.create(
            item=self.item, requested_by=self.junior,
            from_location=self.loc_a, to_location=self.loc_b,
        )
        client = self.auth_client(self.senior)
        resp = client.get("/api/movements/movement-requests/?mine=true")
        results = resp.json().get("results", resp.json())
        self.assertEqual(len(results), 0)


class SerializerTest(MovementFlowTestMixin, TestCase):
    """Test serializer fields."""

    def test_item_request_includes_item_status(self):
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

    def test_box_request_includes_items_status(self):
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
