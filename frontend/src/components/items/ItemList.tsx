// Item list component
import type { PublicCollectionItem } from "../../lib/types";
import ItemCard from "./ItemCard";
import './ItemList.css';

interface ItemListProps {
    items: PublicCollectionItem[];
}

const ItemList: React.FC<ItemListProps> = ({items}) => {
  return (
    <div className="item-list">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default ItemList;