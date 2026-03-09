/**
 * Vercel Serverless Function - SSV API Proxy
 * File: api/clusters.js
 */

export default async function handler(req, res) {
    // Enable CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { owner } = req.query;

        // Validate owner parameter exists
        if (!owner) {
            return res.status(400).json({ error: 'Missing owner parameter' });
        }

        // Validate address format (0x followed by 40 hex characters)
        if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) {
            return res.status(400).json({ error: 'Invalid address format. Use 0x... format' });
        }

        // Fetch from SSV API
        const ssvApiUrl = `https://api.ssv.network/api/v4/clusters?owner=${owner.toLowerCase()}`;
        
        const response = await fetch(ssvApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`SSV API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Return the data with CORS headers
        return res.status(200).json(data);

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Failed to fetch clusters',
            details: error.message
        });
    }
}
