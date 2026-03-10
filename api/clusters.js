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
        const { owner, network } = req.query;

        if (!owner) {
            return res.status(400).json({ error: 'Missing owner parameter' });
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) {
            return res.status(400).json({ error: 'Invalid address format' });
        }

        const net = network || 'mainnet';
        
        // Fetch clusters
        const clustersUrl = `https://api.ssv.network/api/v4/${net}/clusters/owner/${owner.toLowerCase()}`;
        const clustersResponse = await fetch(clustersUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const clustersData = await clustersResponse.json();

        // Fetch total effective balance
        const balanceUrl = `https://api.ssv.network/api/v4/${net}/accounts/${owner.toLowerCase()}/totalEffectiveBalance`;
        const balanceResponse = await fetch(balanceUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const balanceData = await balanceResponse.json();

        // Return both
        return res.status(200).json({
            clusters: clustersData,
            totalEffectiveBalance: balanceData
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch',
            details: error.message
        });
    }
}
