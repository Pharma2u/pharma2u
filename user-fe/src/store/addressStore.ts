import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Address {
  id: string;
  label: string;
  fullAddress: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

interface AddressStore {
  addresses: Address[];
  selectedAddressId: string | null;

  addAddress: (address: Address) => void;
  removeAddress: (addressId: string) => void;
  selectAddress: (addressId: string) => void;
  getSelectedAddress: () => Address | undefined;
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      addresses: [],
      selectedAddressId: null,

      addAddress: (address) => {
        set((state) => ({
          addresses: [...state.addresses, address],
          selectedAddressId: address.id,
        }));
      },

      removeAddress: (addressId) => {
        set((state) => {
          const remainingAddresses = state.addresses.filter(
            (address) => address.id !== addressId
          );

          return {
            addresses: remainingAddresses,
            selectedAddressId:
              state.selectedAddressId === addressId
                ? remainingAddresses[0]?.id ?? null
                : state.selectedAddressId,
          };
        });
      },

      selectAddress: (addressId) => {
        set({
          selectedAddressId: addressId,
        });
      },

      getSelectedAddress: () => {
        const state = get();

        return state.addresses.find(
          (address) => address.id === state.selectedAddressId
        );
      },
    }),
    {
      name: "gocure-addresses",
    }
  )
);