import { useState } from "react";
import { Menu, X, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function DonationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const createCheckoutMutation = trpc.donation.createCheckoutSession.useMutation();

  const handleDonate = async () => {
    try {
      const result = await createCheckoutMutation.mutateAsync();
      if (result?.checkoutUrl) {
        window.open(result.checkoutUrl, "_blank");
        toast.success("Redirecting to checkout...");
        setIsOpen(false);
      } else {
        toast.error("No checkout URL received");
      }
    } catch (error) {
      toast.error("Failed to create checkout session");
      console.error("Donation error:", error);
    }
  };

  const isSubscribed = false;

  return (
    <div className="relative">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-gray-700" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 space-y-3">
            {/* Donation Option */}
            <button
              onClick={handleDonate}
              disabled={createCheckoutMutation.isPending}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
            >
              <Heart className="w-4 h-4 fill-red-600" />
              Support us $1/mo
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Info Text */}
            <p className="text-xs text-gray-500 px-2">
              {isSubscribed
                ? "Thank you for supporting Permit Prep!"
                : "Help us keep Permit Prep free for everyone"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
