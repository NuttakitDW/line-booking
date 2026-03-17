"use client";

import { useState, useEffect } from "react";
import { ServicePicker } from "./ServicePicker";
import { SlotPicker } from "./SlotPicker";
import { ConfirmBooking } from "./ConfirmBooking";

interface Profile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
}

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

type Step = "service" | "slot" | "confirm";

export function BookingFlow({ profile }: { profile: Profile }) {
  const [step, setStep] = useState<Step>("service");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => setServices(data))
      .finally(() => setLoading(false));
  }, []);

  function handleServiceSelect(service: Service) {
    setSelectedService(service);
    setStep("slot");
  }

  function handleSlotSelect(slot: TimeSlot) {
    setSelectedSlot(slot);
    setStep("confirm");
  }

  function handleBack() {
    if (step === "slot") {
      setSelectedSlot(null);
      setStep("service");
    } else if (step === "confirm") {
      setSelectedSlot(null);
      setStep("slot");
    }
  }

  return (
    <div className="min-h-screen pb-[var(--safe-area-bottom)]">
      {/* Header */}
      <div className="bg-[var(--color-primary)] text-white px-6 pt-12 pb-6">
        <div className="flex items-center gap-3">
          {profile.pictureUrl && (
            <img
              src={profile.pictureUrl}
              alt={profile.displayName}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <p className="text-sm opacity-80">สวัสดีค่ะ</p>
            <p className="font-semibold">{profile.displayName}</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold mt-4">จองคิวพี่แกงส้ม</h1>
        <p className="text-sm opacity-80 mt-1">เลือกบริการและเวลาที่สะดวก</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-4">
        {(["service", "slot", "confirm"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === s
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </div>
            {i < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Back button */}
      {step !== "service" && (
        <button
          onClick={handleBack}
          className="flex items-center gap-1 px-6 py-2 text-[var(--color-text-secondary)] text-sm"
        >
          <span>←</span> ย้อนกลับ
        </button>
      )}

      {/* Content */}
      <div className="px-4">
        {step === "service" && (
          <ServicePicker
            services={services}
            loading={loading}
            onSelect={handleServiceSelect}
          />
        )}
        {step === "slot" && selectedService && (
          <SlotPicker
            serviceId={selectedService.id}
            onSelect={handleSlotSelect}
          />
        )}
        {step === "confirm" && selectedService && selectedSlot && (
          <ConfirmBooking
            profile={profile}
            service={selectedService}
            slot={selectedSlot}
          />
        )}
      </div>
    </div>
  );
}
