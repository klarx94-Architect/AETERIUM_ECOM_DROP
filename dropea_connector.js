export async function dropeaQuery(query, variables = {}) {
    const endpoint = "https://api.dropea.com/graphql/dropshippers";
    const apiKey = "AIzaEU6B6Q2IrprVgzVHwCuNxNwGeNffPq8mrP8r5HMU_vE=";

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
        },
        body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}
