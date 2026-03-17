"use client";

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
}

interface Props {
  services: Service[];
  loading: boolean;
  onSelect: (service: Service) => void;
}

function formatPrice(satang: number): string {
  return `฿${(satang / 100).toLocaleString()}`;
}

export function ServicePicker({ services, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--color-text-secondary)]">
        <p className="text-4xl mb-3">📋</p>
        <p>ยังไม่มีบริการในขณะนี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => onSelect(service)}
          className="w-full bg-white rounded-2xl p-5 shadow-sm text-left hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{service.name}</h3>
              {service.description && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {service.description}
                </p>
              )}
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                ⏱ {service.durationMin} นาที
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[var(--color-primary)]">
                {formatPrice(service.price)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
