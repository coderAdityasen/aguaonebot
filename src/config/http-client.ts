import axios from 'axios';
import https from 'https';
import dns from 'dns';

// Optimize DNS lookup to prefer IPv4 first and avoid IPv6 resolution latency
dns.setDefaultResultOrder('ipv4first');

// Persistent Keep-Alive HTTPS agent that reuses TLS sockets
export const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000, // Keep socket alive for 60 seconds
  maxSockets: 50,        // Allow up to 50 concurrent sockets to Meta
  maxFreeSockets: 10,    // Keep 10 idle sockets warm and ready
  timeout: 10000
});

// Axios instance configured for low-latency calls to Meta Graph API
export const metaHttpClient = axios.create({
  httpsAgent,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive'
  }
});
