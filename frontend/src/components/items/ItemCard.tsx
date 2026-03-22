// Item card component
import type { CollectionItem } from "../../lib/types"
import './ItemCard.css';

interface ItemCardProps {
  item: CollectionItem;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  return (
    <div className="item-card">
      <h3 className="item-card-title">{item.title}</h3>
      <p className="item-card-field"><strong>Item Code:</strong> {item.item_code}</p>
      <p className="item-card-field"><strong>Platform:</strong> {item.platform}</p>
      <p className="item-card-field"><strong>Description:</strong> {item.description}</p>
      <span className={`item-card-badge ${item.is_on_floor ? 'on-floor' : 'in-storage'}`}>
        {item.is_on_floor ? "On Floor" : "In Storage"}
      </span>
    </div>
  );
}

export default ItemCard;