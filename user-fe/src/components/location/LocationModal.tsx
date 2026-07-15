"use client";

import { FormEvent, useState } from "react";

import { Check, Crosshair, Home, Plus, Trash2, X } from "lucide-react";

import { Address, useAddressStore } from "@/src/store/addressStore";

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LocationModal({ open, onClose }: LocationModalProps) {
  const addresses = useAddressStore((state) => state.addresses);

  const selectedAddressId = useAddressStore((state) => state.selectedAddressId);

  const addAddress = useAddressStore((state) => state.addAddress);

  const removeAddress = useAddressStore((state) => state.removeAddress);

  const selectAddress = useAddressStore((state) => state.selectAddress);

  const [showAddressForm, setShowAddressForm] = useState(false);

  const [label, setLabel] = useState("Home");
  const [fullAddress, setFullAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");

  if (!open) {
    return null;
  }

  const resetForm = () => {
    setLabel("Home");
    setFullAddress("");
    setCity("");
    setStateName("");
    setPincode("");
  };

  const handleAddAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !label.trim() ||
      !fullAddress.trim() ||
      !city.trim() ||
      !stateName.trim() ||
      !pincode.trim()
    ) {
      return;
    }

    const newAddress: Address = {
      id: crypto.randomUUID(),
      label: label.trim(),
      fullAddress: fullAddress.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
    };

    addAddress(newAddress);

    resetForm();

    setShowAddressForm(false);

    onClose();
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      window.alert("Location services are not supported by your browser.");

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentAddress: Address = {
          id: crypto.randomUUID(),
          label: "Current location",
          fullAddress: "Current GPS location",
          city: "Location detected",
          state: "",
          pincode: "",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        addAddress(currentAddress);

        onClose();
      },

      () => {
        window.alert(
          "Unable to access your location. Please allow location permission or add an address manually.",
        );
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close location modal"
        onClick={onClose}
        className="absolute inset-0 bg-[#17212B]/50 backdrop-blur-[2px]"
      />

      <div className="relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:max-w-[560px] sm:rounded-3xl">
        {/* HEADER */}

        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#EDF0EF] bg-white px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-xl font-bold text-[#17212B]">
              Select delivery location
            </h2>

            <p className="mt-1 text-xs text-[#8B949E]">
              Find medicines available from pharmacies near you
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4F7F6] text-[#17212B]"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {/* CURRENT LOCATION */}

          <button
            type="button"
            onClick={handleCurrentLocation}
            className="flex w-full items-center gap-4 rounded-2xl border border-[#45C9A5] bg-[#F4FCF9] p-4 text-left transition hover:bg-[#EAFAF5]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#2EB68F]">
              <Crosshair size={20} />
            </div>

            <div className="flex-1">
              <p className="text-sm font-bold text-[#17212B]">
                Use current location
              </p>

              <p className="mt-1 text-xs text-[#64717D]">
                Allow location access to find nearby pharmacies
              </p>
            </div>
          </button>

          {/* SAVED ADDRESSES */}

          {addresses.length > 0 && (
            <div className="mt-7">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8B949E]">
                Saved addresses
              </p>

              <div className="mt-4 space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                      selectedAddressId === address.id
                        ? "border-[#45C9A5] bg-[#F4FCF9]"
                        : "border-[#E5EAE8]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        selectAddress(address.id);
                        onClose();
                      }}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAFAF5] text-[#2EB68F]">
                        <Home size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#17212B]">
                            {address.label}
                          </p>

                          {selectedAddressId === address.id && (
                            <Check size={15} className="text-[#2EB68F]" />
                          )}
                        </div>

                        <p className="mt-1 text-sm leading-5 text-[#64717D]">
                          {address.fullAddress}
                        </p>

                        <p className="mt-1 text-xs text-[#8B949E]">
                          {address.city}
                          {address.state ? `, ${address.state}` : ""}
                          {address.pincode ? ` - ${address.pincode}` : ""}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      aria-label="Delete address"
                      onClick={() => removeAddress(address.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8B949E] transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADD ADDRESS */}

          {!showAddressForm ? (
            <button
              type="button"
              onClick={() => setShowAddressForm(true)}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#45C9A5] text-sm font-bold text-[#2EB68F] transition hover:bg-[#F4FCF9]"
            >
              <Plus size={17} />
              Add new address
            </button>
          ) : (
            <form
              onSubmit={handleAddAddress}
              className="mt-6 rounded-2xl border border-[#E5EAE8] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[#17212B]">
                  Add delivery address
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddressForm(false);
                    resetForm();
                  }}
                  className="text-xs font-bold text-[#8B949E]"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="address-label"
                    className="text-xs font-bold text-[#17212B]"
                  >
                    Address label
                  </label>

                  <input
                    id="address-label"
                    type="text"
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder="Home, Work, Other"
                    className="mt-2 h-12 w-full rounded-xl border border-[#DDE5E2] px-4 text-sm outline-none transition focus:border-[#45C9A5] focus:ring-4 focus:ring-[#45C9A5]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="full-address"
                    className="text-xs font-bold text-[#17212B]"
                  >
                    Complete address
                  </label>

                  <textarea
                    id="full-address"
                    value={fullAddress}
                    onChange={(event) => setFullAddress(event.target.value)}
                    placeholder="Flat, building, street, area"
                    rows={3}
                    className="mt-2 w-full resize-none rounded-xl border border-[#DDE5E2] p-4 text-sm outline-none transition focus:border-[#45C9A5] focus:ring-4 focus:ring-[#45C9A5]/10"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="city"
                      className="text-xs font-bold text-[#17212B]"
                    >
                      City
                    </label>

                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="Hyderabad"
                      className="mt-2 h-12 w-full rounded-xl border border-[#DDE5E2] px-4 text-sm outline-none transition focus:border-[#45C9A5]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="state"
                      className="text-xs font-bold text-[#17212B]"
                    >
                      State
                    </label>

                    <input
                      id="state"
                      type="text"
                      value={stateName}
                      onChange={(event) => setStateName(event.target.value)}
                      placeholder="Telangana"
                      className="mt-2 h-12 w-full rounded-xl border border-[#DDE5E2] px-4 text-sm outline-none transition focus:border-[#45C9A5]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="pincode"
                    className="text-xs font-bold text-[#17212B]"
                  >
                    Pincode
                  </label>

                  <input
                    id="pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(event) =>
                      setPincode(event.target.value.replace(/\D/g, ""))
                    }
                    placeholder="500001"
                    className="mt-2 h-12 w-full rounded-xl border border-[#DDE5E2] px-4 text-sm outline-none transition focus:border-[#45C9A5]"
                  />
                </div>

                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#45C9A5] text-sm font-bold text-[#17212B] transition hover:bg-[#2EB68F] hover:text-white"
                >
                  Save and deliver here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
