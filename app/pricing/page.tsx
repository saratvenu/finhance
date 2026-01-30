"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Check } from "lucide-react";

const pricingPlans = [
  {
    title: "Free",
    description: "Perfect for individuals and hobby projects.",
    price: "$0",
    features: [
      "Up to 3 accounts",
      "Basic transaction tracking",
      "Local data storage",
      "Email support",
    ],
    buttonText: "Start for Free",
    buttonVariant: "flat" as const,
  },
  {
    title: "Business",
    description: "Best for teams and financial management at scale.",
    price: "$19",
    priceSub: "/month",
    features: [
      "Unlimited accounts",
      "Advanced analytics dashboard",
      "Team collaboration tools",
      "Priority support",
      "Data export & integrations",
    ],
    buttonText: "Upgrade Now",
    buttonVariant: "solid" as const,
  },
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleFreeClick = () => {
    if (isSignedIn) {
      router.push("/dashboard");
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-6">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-muted-foreground text-lg">
          Choose the plan that fits your needs — upgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {pricingPlans.map((plan) => (
          <Card
            key={plan.title}
            className="shadow-lg hover:shadow-xl transition-all border border-border rounded-xl"
          >
            <CardHeader className="flex flex-col items-center gap-2 pb-0">
              <h2 className="text-2xl font-semibold">{plan.title}</h2>
              <p className="text-sm text-muted-foreground text-center">
                {plan.description}
              </p>
            </CardHeader>

            <CardBody className="flex flex-col items-center">
              <div className="text-5xl font-bold mt-4">
                {plan.price}
                {plan.priceSub && (
                  <span className="text-base text-muted-foreground font-normal">
                    {plan.priceSub}
                  </span>
                )}
              </div>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-left"
                  >
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardBody>

            <CardFooter className="flex justify-center mt-4">
              {plan.title === "Free" ? (
                <Button
                  color="primary"
                  variant={plan.buttonVariant}
                  size="lg"
                  className="w-full"
                  onPress={handleFreeClick}
                >
                  {plan.buttonText}
                </Button>
              ) : (
                <Button
                  color="primary"
                  variant={plan.buttonVariant}
                  size="lg"
                  className="w-full"
                >
                  {plan.buttonText}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center text-sm text-muted-foreground">
        💡 No hidden fees. Cancel or change your plan anytime.
      </div>
    </div>
  );
}
