import Dropdown from "react-bootstrap/Dropdown";
import Icon from "@/components/common/Icon";
import type { StoreOption } from "@/types";

export interface StoreSwitcherDropdownProps {
  stores: StoreOption[];
  activeStoreId: string;
  onSelectStore: (storeId: string) => void;
}

const StoreSwitcherDropdown = ({
  stores,
  activeStoreId,
  onSelectStore,
}: StoreSwitcherDropdownProps) => {
  const activeStore = stores.find((store) => store.id === activeStoreId) ?? stores[0];

  return (
    <Dropdown>
      <Dropdown.Toggle
        as="a"
        href="#"
        bsPrefix="d-inline-flex align-items-center fw-medium store-switcher-toggle"
      >
        <div className="avatar avatar-xs avatar-rounded me-1">
          <img src={activeStore.imageUrl} alt="store" className="img-fluid" />
        </div>
        {activeStore.name}
        <Icon name="chevrons-up-down" className="ms-2" />
      </Dropdown.Toggle>
      <Dropdown.Menu className="p-3 mt-3">
        {stores.map((store) => (
          <Dropdown.Item
            key={store.id}
            className="d-flex align-items-center"
            active={store.id === activeStoreId}
            onClick={() => onSelectStore(store.id)}
          >
            <div className="avatar avatar-xs avatar-rounded me-2">
              <img src={store.imageUrl} alt="store" className="img-fluid" />
            </div>
            {store.name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default StoreSwitcherDropdown;
