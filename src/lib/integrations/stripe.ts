import "server-only";

export interface StripeAccount {
  id: string; // acct_...
  display_name: string | null;
}

export async function fetchStripeAccount(secretKey: string): Promise<StripeAccount> {
  const res = await fetch("https://api.stripe.com/v1/account", {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Stripe API ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 300)}` : ""}`,
    );
  }

  const account = (await res.json()) as {
    id?: string;
    display_name?: string | null;
    business_profile?: { name?: string | null } | null;
  };

  if (!account.id) {
    throw new Error("Stripe /v1/account response missing id field");
  }

  return {
    id: account.id,
    display_name:
      account.display_name ?? account.business_profile?.name ?? null,
  };
}
