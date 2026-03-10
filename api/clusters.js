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
        // Extract from path: /api/clusters/[network]/[type]/[owner]
        const pathParts = req.url.split('/').filter(p => p && p !== 'api' && p !== 'clusters');
        
        let network = 'mainnet';
        let type = 'clusters'; // default
        let owner = null;

        // Parse path segments
        if (pathParts.length >= 2) {
            network = pathParts[0];
            owner = pathParts[1];
        }
        if (pathParts.length >= 3) {
            type = pathParts[1];
            owner = pathParts[2];
        }

        // Also check query parameters as fallback
        const queryOwner = req.query?.owner;
        const queryNetwork = req.query?.network || 'mainnet';
        const queryType = req.query?.type || 'clusters';

        if (queryOwner) {
            owner = queryOwner;
            network = queryNetwork;
            type = queryType;
        }

        if (!owner) {
            return res.status(400).json({ error: 'Missing owner parameter' });
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) {
            return res.status(400).json({ error: 'Invalid address format' });
        }

        let ssvApiUrl;

        if (type === 'balance') {
            // Get total effective balance
            ssvApiUrl = `https://api.ssv.network/api/v4/${network}/accounts/${owner.toLowerCase()}/totalEffectiveBalance`;
        } else {
            // Get clusters by owner
            ssvApiUrl = `https://api.ssv.network/api/v4/${network}/clusters/owner/${owner.toLowerCase()}`;
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
