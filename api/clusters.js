export default async function handler(req, res) {
    // Enable CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { owner, network, clusterHash } = req.query;
        const net = network || 'mainnet';

        // If clusterHash is provided, get effective balance for that specific cluster
        if (clusterHash) {
            const balanceUrl = `https://api.ssv.network/api/v4/${net}/clusters/${clusterHash}/totalEffectiveBalance`;
            const response = await fetch(balanceUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            return res.status(response.status).json(data);
        }

        // Otherwise, get clusters for owner
        if (!owner) {
            return res.status(400).json({ error: 'Missing owner or clusterHash parameter' });
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) {
            return res.status(400).json({ error: 'Invalid address format' });
        }

        // Fetch clusters
        const clustersUrl = `https://api.ssv.network/api/v4/${net}/clusters/owner/${owner.toLowerCase()}`;
        const clustersResponse = await fetch(clustersUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const clustersData = await clustersResponse.json();

        // Fetch effective balance for each cluster
        if (clustersData.clusters && clustersData.clusters.clusters) {
            const clustersWithBalance = await Promise.all(
                clustersData.clusters.clusters.map(async (cluster) => {
                    try {
                        const balanceUrl = `https://api.ssv.network/api/v4/${net}/clusters/${cluster.id}/totalEffectiveBalance`;
                        const balanceResponse = await fetch(balanceUrl, {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        const balanceData = await balanceResponse.json();
                        return {
                            ...cluster,
                            effectiveBalance: balanceData.effectiveBalance || '0'
                        };
                    } catch (err) {
                        console.error('Error fetching balance for cluster', cluster.id, err);
                        return {
                            ...cluster,
                            effectiveBalance: '0'
                        };
                    }
                })
            );
            clustersData.clusters.clusters = clustersWithBalance;
        }

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
