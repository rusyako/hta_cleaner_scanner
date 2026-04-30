// convert-cert.js - Конвертация PFX в PEM
const fs = require('fs');
const path = require('path');
const forge = require('node-forge');

const certsDir = path.resolve(__dirname, '../certs');
const pfxPath = path.join(certsDir, 'localhost.pfx');
const password = 'dev123';

// Читаем PFX файл
const pfxData = fs.readFileSync(pfxPath, 'binary');

// Конвертируем PFX в PEM
const p12Asn1 = forge.asn1.fromDer(pfxData);
const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

// Извлекаем приватный ключ
const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
const bag = bags[forge.pki.oids.pkcs8ShroudedKeyBag][0];
const privateKey = forge.pki.privateKeyToPem(bag.key);

// Извлекаем сертификат
const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
const certBag = certBags[forge.pki.oids.certBag][0];
const certificate = forge.pki.certificateToPem(certBag.cert);

// Сохраняем файлы
fs.writeFileSync(path.join(certsDir, 'localhost.key'), privateKey);
fs.writeFileSync(path.join(certsDir, 'localhost.pem'), certificate);

console.log('✓ Certificate converted successfully!');
console.log('  - localhost.key (private key)');
console.log('  - localhost.pem (certificate)');
