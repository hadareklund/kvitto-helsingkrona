import PocketBase from 'pocketbase';

const pb = new PocketBase(import.meta.env.VITE_PB_URL || 'http://localhost:8090');

// Enable auto-cancellation for pending requests
pb.autoCancellation(false);

export default pb;
