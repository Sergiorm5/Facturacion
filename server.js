import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import axios from 'axios';

const app = express();
const PORT = 3000;
const API_KEY = 'sk_test_Ee01rLNqgyDxlMq2gNA0l01CPXPg5X2mpWBna9oGAd';

app.use(bodyParser.json());
app.use(express.static('public')); // sirve index.html

app.post('/generate-invoice', async (req, res) => {
  try {
    const payload = req.body; // ahora esperamos que el frontend envíe directamente `customer` y `items`

    // Validación rápida
    if (!payload.customer || !payload.customer.legal_name) {
      return res.json({ success: false, error: '"customer.legal_name" is required' });
    }

    const { data: invoice } = await axios.post(
      'https://www.facturapi.io/v2/invoices',
      payload,
      { auth: { username: API_KEY, password: '' } }
    );

    // Descargar PDF
    const pdfRes = await axios.get(`https://www.facturapi.io/v2/invoices/${invoice.id}/pdf`, {
      responseType: 'arraybuffer',
      auth: { username: API_KEY, password: '' }
    });
    const pdfPath = `public/factura_${invoice.id}.pdf`;
    fs.writeFileSync(pdfPath, pdfRes.data);

    // Descargar XML
    const xmlRes = await axios.get(`https://www.facturapi.io/v2/invoices/${invoice.id}/xml`, {
      responseType: 'arraybuffer',
      auth: { username: API_KEY, password: '' }
    });
    const xmlPath = `public/factura_${invoice.id}.xml`;
    fs.writeFileSync(xmlPath, xmlRes.data);

    res.json({ success: true, id: invoice.id, pdf: pdfPath, xml: xmlPath });

  } catch (err) {
    console.error(err.response?.data || err);
    res.json({ success: false, error: err.response?.data || err.message });
  }
});


app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
