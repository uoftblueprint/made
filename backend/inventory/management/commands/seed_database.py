import json
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from inventory.models import Location, Box, CollectionItem, ItemHistory
from users.models import VolunteerApplication
from movements.models import ItemMovementRequest


class Command(BaseCommand):
    help = "Seed the database with sample data from a JSON file"

    def add_arguments(self, parser):
        parser.add_argument(
            '--json-file',
            type=str,
            default=None,
            help='Path to the JSON seed file. Defaults to seed_data.json in the same directory.'
        )

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # Determine JSON file path
        json_file = options.get('json_file')
        if not json_file:
            json_file = os.path.join(os.path.dirname(__file__), 'seed_data.json')

        if not os.path.exists(json_file):
            self.stderr.write(self.style.ERROR(f"Seed file not found: {json_file}"))
            return

        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Create locations
        self.stdout.write("Creating locations...")
        locations = {}
        for loc_data in data.get("locations", []):
            location, _ = Location.objects.get_or_create(
                name=loc_data["name"],
                defaults={
                    "location_type": loc_data["location_type"],
                    "description": loc_data.get("description", ""),
                }
            )
            locations[loc_data["name"]] = location
        self.stdout.write(f"  Processed {len(data.get('locations', []))} locations")

        # Create boxes
        self.stdout.write("Creating boxes...")
        boxes = {}
        for box_data in data.get("boxes", []):
            location = locations.get(box_data["location"])
            if not location:
                self.stderr.write(f"  Warning: Location '{box_data['location']}' not found for box '{box_data['box_code']}'")
                continue
            box, _ = Box.objects.get_or_create(
                box_code=box_data["box_code"],
                defaults={
                    "label": box_data.get("label", ""),
                    "description": box_data.get("description", ""),
                    "location": location,
                }
            )
            boxes[box_data["box_code"]] = box
        self.stdout.write(f"  Processed {len(data.get('boxes', []))} boxes")

        # Create collection items
        self.stdout.write("Creating collection items...")
        items_created = 0
        for item_data in data.get("items", []):
            box = boxes.get(item_data.get("box"))
            location = locations.get(item_data["location"])
            if not location:
                self.stderr.write(f"  Warning: Location '{item_data['location']}' not found for item '{item_data['item_code']}'")
                continue

            is_on_floor = location.location_type == "FLOOR"

            item, created = CollectionItem.objects.get_or_create(
                item_code=item_data["item_code"],
                defaults={
                    "title": item_data["title"],
                    "platform": item_data.get("platform", ""),
                    "description": item_data.get("description", ""),
                    "item_type": item_data.get("item_type", "SOFTWARE"),
                    "condition": item_data.get("condition", "GOOD"),
                    "is_complete": item_data.get("is_complete", "UNKNOWN"),
                    "is_functional": item_data.get("is_functional", "UNKNOWN"),
                    "working_condition": item_data.get("working_condition", True),
                    "status": item_data.get("status", "AVAILABLE"),
                    "creator_publisher": item_data.get("creator_publisher", ""),
                    "release_year": item_data.get("release_year", ""),
                    "version_edition": item_data.get("version_edition", ""),
                    "media_type": item_data.get("media_type", ""),
                    "manufacturer": item_data.get("manufacturer", ""),
                    "model_number": item_data.get("model_number", ""),
                    "year_manufactured": item_data.get("year_manufactured", ""),
                    "serial_number": item_data.get("serial_number", ""),
                    "hardware_type": item_data.get("hardware_type", ""),
                    "box": box,
                    "current_location": location,
                    "is_on_floor": is_on_floor,
                    "is_public_visible": item_data.get("is_public_visible", True),
                }
            )

            if created:
                items_created += 1
                ItemHistory.objects.create(
                    item=item,
                    event_type="INITIAL",
                    to_location=location,
                    notes="Initial cataloging"
                )
        self.stdout.write(f"  Created {items_created} collection items")

        # Create admin user if not exists
        self.stdout.write("Creating users...")
        User = get_user_model()
        admin_user = None

        for user_data in data.get("users", []):
            expires_days = user_data.get("access_expires_days")
            access_expires_at = None
            if expires_days is not None:
                access_expires_at = timezone.now() + timedelta(days=expires_days)

            user, created = User.objects.get_or_create(
                email=user_data["email"],
                defaults={
                    "name": user_data["name"],
                    "role": user_data.get("role", "VOLUNTEER"),
                    "is_active": user_data.get("is_active", True),
                    "is_staff": user_data.get("is_staff", False),
                    "is_superuser": user_data.get("is_superuser", False),
                    "access_expires_at": access_expires_at,
                }
            )
            if created:
                user.set_password(user_data.get("password", "password123"))
                user.save()

            if user_data.get("role") == "ADMIN" and admin_user is None:
                admin_user = user

        self.stdout.write(f"  Processed {len(data.get('users', []))} users")

        # Create volunteer applications
        self.stdout.write("Creating volunteer applications...")
        for app_data in data.get("applications", []):
            app, created = VolunteerApplication.objects.get_or_create(
                email=app_data["email"],
                defaults={
                    "name": app_data["name"],
                    "motivation_text": app_data.get("motivation_text", ""),
                    "status": app_data.get("status", "PENDING"),
                }
            )
            if created and app_data.get("status") != "PENDING" and admin_user:
                app.reviewed_at = timezone.now() - timedelta(days=7)
                app.reviewed_by = admin_user
                app.save()
        self.stdout.write(f"  Processed {len(data.get('applications', []))} applications")

        # Create movement requests
        self.stdout.write("Creating movement requests...")
        volunteer_user = User.objects.filter(role="VOLUNTEER", is_active=True).first()
        movements_created = 0

        for req_data in data.get("movement_requests", []):
            try:
                item = CollectionItem.objects.get(item_code=req_data["item_code"])
                from_location = locations.get(req_data["from_location"])
                to_location = locations.get(req_data["to_location"])

                if not from_location or not to_location:
                    continue

                request, created = ItemMovementRequest.objects.get_or_create(
                    item=item,
                    from_location=from_location,
                    to_location=to_location,
                    status=req_data.get("status", "WAITING_APPROVAL"),
                    defaults={
                        "requested_by": volunteer_user,
                        "admin": admin_user if req_data.get("status") in ["APPROVED", "REJECTED"] else None,
                        "admin_comment": req_data.get("admin_comment", ""),
                    }
                )
                if created:
                    movements_created += 1
            except CollectionItem.DoesNotExist:
                continue
        self.stdout.write(f"  Created {movements_created} movement requests")

        # Summary
        items_count = CollectionItem.objects.count()
        boxes_count = Box.objects.count()
        locations_count = Location.objects.count()
        users_count = User.objects.count()
        applications_count = VolunteerApplication.objects.count()
        requests_count = ItemMovementRequest.objects.count()

        self.stdout.write(self.style.SUCCESS(f"\nDatabase seeded successfully!"))
        self.stdout.write(f"  - {locations_count} locations")
        self.stdout.write(f"  - {boxes_count} boxes")
        self.stdout.write(f"  - {items_count} collection items")
        self.stdout.write(f"  - {users_count} users")
        self.stdout.write(f"  - {applications_count} volunteer applications")
        self.stdout.write(f"  - {requests_count} movement requests")
        self.stdout.write(f"\nAdmin login: admin@made.org / admin123")
        self.stdout.write(f"Volunteer login: volunteer@made.org / volunteer123")
