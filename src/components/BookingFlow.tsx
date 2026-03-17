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
  date: string;
  startTime: string;
  endTime: string;
}

type Step = "service" | "slot";

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
  }

  function handleBack() {
    if (step === "slot") {
      setSelectedSlot(null);
      setStep("service");
    }
  }

  return (
    <div className="min-h-screen pb-[var(--safe-area-bottom)]">
      {/* Header - Red gradient background */}
      <div
        className="text-white px-6 pt-12 pb-8 relative overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at center top, #E62020 0%, #CC0000 40%, #8B0000 100%)",
        }}
      >
        {/* Subtle glow overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10">
          {/* User greeting */}
          <div className="flex items-center gap-3">
            {profile.pictureUrl && (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="w-10 h-10 rounded-full border-2 border-white/30"
              />
            )}
            <div>
              <p className="text-sm opacity-80">สวัสดีค่ะ</p>
              <p className="font-semibold">{profile.displayName}</p>
            </div>
          </div>

          {/* Brand title */}
          <div className="mt-5">
            <h1 className="text-2xl font-bold tracking-wide">
              โค้ชแกงส้ม
            </h1>
            <p className="text-sm opacity-80 mt-1">
              Feng Shui Master Coach | เลือกบริการและเวลาที่สะดวก
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-4">
        {(["service", "slot"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                step === s
                  ? "bg-primary text-white"
                  : "bg-primary-light text-primary"
              }`}
            >
              {i + 1}
            </div>
            {i < 1 && (
              <div className="w-8 h-0.5 bg-primary-light" />
            )}
          </div>
        ))}
      </div>

      {/* Back button */}
      {step !== "service" && (
        <button
          onClick={handleBack}
          className="flex items-center gap-1 px-6 py-2 text-text-secondary text-sm"
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
      </div>

      {/* Confirm popup */}
      {selectedSlot && selectedService && (
        <ConfirmBooking
          profile={profile}
          service={selectedService}
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
