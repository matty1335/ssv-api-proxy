export default async function handler(req, res) {
    // Enable CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { owner, network, type } = req.query;

        if (!owner) {
            return res.status(400).json({ error: 'Missing owner parameter' });
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) {
            return res.status(400).json({ error: 'Invalid address format' });
        }

        const net = network || 'mainnet';
        let ssvApiUrl;

        // Route based on type parameter
        if (type === 'balance') {
            // Get total effective balance
            ssvApiUrl = `https://api.ssv.network/api/v4/${net}/accounts/${owner.toLowerCase()}/totalEffectiveBalance`;
        } else {
            // Get clusters (default)
            ssvApiUrl = `https://api.ssv.network/api/v4/${net}/clusters?owner=${owner.toLowerCase()}`;
        }
        
        console.log('Fetching from:', ssvApiUrl);
        
        const response = await fetch(ssvApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();
        console.log('Response:', data);

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch',
            details: error.message
        });
    }
}
