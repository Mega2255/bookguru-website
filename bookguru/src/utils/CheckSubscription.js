export async function checkSubscription(token) {
  const res = await fetch("http://localhost:5000/api/subscription/status", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await res.json();
}
