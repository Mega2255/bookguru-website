export async function checkSubscription(token) {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/subscription/status`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return await res.json();
}
