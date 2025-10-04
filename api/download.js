// api/download.js - Serverless function untuk Vercel
const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validasi URL
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Konfigurasi untuk RapidAPI
    const options = {
      method: 'POST',
      url: 'https://all-video-downloader1.p.rapidapi.com/all',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-rapidapi-host': 'all-video-downloader1.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY || '837393c934msh8747bcb37b91d8ep1ba687jsn4ed59f6c1497'
      },
      data: new URLSearchParams({
        url: url
      })
    };

    const response = await axios.request(options);
    
    // Format response sesuai kebutuhan aplikasi kita
    let downloadLinks = [];
    
    // Cek struktur response dan format data
    if (response.data && Array.isArray(response.data)) {
      downloadLinks = response.data.map(item => ({
        quality: item.quality || 'Unknown',
        url: item.url || item.link
      }));
    } else if (response.data && response.data.video) {
      downloadLinks = [{
        quality: 'Video',
        url: response.data.video
      }];
    } else if (response.data && response.data.links) {
      downloadLinks = response.data.links;
    }

    res.status(200).json({
      success: true,
      originalUrl: url,
      downloadLinks: downloadLinks
    });

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle berbagai jenis error
    if (error.response) {
      // Error dari RapidAPI
      res.status(error.response.status).json({
        error: error.response.data.message || 'Error from video service'
      });
    } else if (error.request) {
      // Tidak ada response
      res.status(500).json({
        error: 'No response from video service'
      });
    } else {
      // Error lainnya
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
};
