const fs = require('fs');

fetch('http://localhost:8080/instance/create', {
    method: 'POST',
    headers: {
        'apikey': 'clave_secreta_golazo_123',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        instanceName: 'CanchaBot',
        qrcode: true
    })
})
.then(r => r.json())
.then(d => {
    if (d?.qrcode?.base64) {
        fs.writeFileSync('qr.html', `<!DOCTYPE html><html><body><h1>Escanea este QR con tu WhatsApp</h1><img src="${d.qrcode.base64}" /></body></html>`);
        console.log('QR Code generated and saved to qr.html');
    } else {
        console.log('No QR code returned:', d);
    }
})
.catch(console.error);
