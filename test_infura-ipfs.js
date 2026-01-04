const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// 1. Load credentials
const projectId = process.env.REACT_APP_PROJECTID;
const projectSecret = process.env.REACT_APP_PROJECTSECRET;

// 2. Configure Infura IPFS Endpoint
const endpoint = 'https://ipfs.infura.io:5001/api/v0/add';

async function testIPFS() {
    try {
        // Create form data (the "file" you are uploading)
        const form = new FormData();
        form.append('file', 'Hello Infura IPFS! This is a test for my NFT metadata.');

        // Infura requires Basic Auth: base64(ProjectID:ProjectSecret)
        const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

        const response = await axios.post(endpoint, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: auth,
            },
        });

        console.log('✅ IPFS Key is working!');
        console.log('CID (Hash):', response.data.Hash);
        console.log('View file at:', `https://skywalker.infura-ipfs.io/ipfs/${response.data.Hash}`);
    } catch (err) {
        console.error('❌ IPFS Test Failed:', err.response ? err.response.data : err.message);
    }
}

testIPFS();