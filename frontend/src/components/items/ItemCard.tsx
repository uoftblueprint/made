// Item card component

import type { PublicCollectionItem } from "../../lib/types"

interface ItemCardProps {
  item: PublicCollectionItem;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  return (
    <div style={{
      border: "1px solid #ccc",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "12px",
      maxWidth: "20em"
    }}>
      <p><strong>ID:</strong> {item.id}</p>
      <p><strong>Item Code:</strong> {item.item_code}</p>
      <p><strong>Title:</strong> {item.title}</p>
      <p><strong>Platform:</strong> {item.platform}</p>
      <p><strong>Description:</strong> {item.description}</p>
      <p><strong>On Floor:</strong> {item.is_on_floor ? "Yes" : "No"}</p>
    </div>
  );
}

export default ItemCard;