export async function dropeaQuery(query, variables = {}) {
  const endpoint = 'https://api.dropea.com/graphql/dropshippers';
  const apiKey = process.env.DROPEA_API_KEY;

  if (!apiKey) {
    throw new Error('DROPEA_API_KEY no configurada en variables de entorno');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Dropea HTTP Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
