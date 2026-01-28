"""
Simple management command to rebuild item locations from history.
"""

from django.core.management.base import BaseCommand
from inventory.models import CollectionItem


class Command(BaseCommand):
    help = "Rebuild current_location and is_on_floor for all CollectionItems based on their history"

    def add_arguments(self, parser):
        parser.add_argument(
            "--item-id",
            type=int,
            help="Update only the specified item ID",
        )

    def handle(self, *args, **options):
        item_id = options.get("item_id")

        if item_id:
            # Single item
            try:
                item = CollectionItem.objects.get(id=item_id)
                item.update_location_from_history()
                self.stdout.write(self.style.SUCCESS(f"Updated item {item_id}"))
            except CollectionItem.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Item {item_id} not found"))
        else:
            # All items
            items = CollectionItem.objects.all()
            updated_count = 0

            for item in items:
                try:
                    item.update_location_from_history()
                    updated_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"Error updating item {item.id}: {e}")
                    )

            self.stdout.write(self.style.SUCCESS(f"Updated {updated_count} items"))
