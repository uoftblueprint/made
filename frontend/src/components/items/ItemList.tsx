// Item list component
// Item list component

import type { PublicCollectionItem } from "../../lib/types";
import ItemCard from "./ItemCard";

interface ItemListProps {
    items: PublicCollectionItem[];
}

const ItemList: React.FC<ItemListProps> = ({items}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "1rem",
        maxWidth: "100%",
      }}
    >
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default ItemList;