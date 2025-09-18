import axios from 'axios';

const API_KEY = 'sk_test_Ee01rLNqgyDxlMq2gNA0l01CPXPg5X2mpWBna9oGAd';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    if (!payload.customer || !payload.customer.legal_name) {
      return res.status(400).json({ success: false, error: '"customer.legal_name" is required' });
    }

    // Crear factura
    const { data: invoice } = await axios.post(
      'https://www.facturapi.io/v2/invoices',
      payload,
      { auth: { username: API_KEY, password: '' } }
    );

    // Obtener PDF y XML como arraybuffer
    const [pdfRes, xmlRes] = await Promise.all([
      axios.get(`https://www.facturapi.io/v2/invoices/${invoice.id}/pdf`, {
        responseType: 'arraybuffer',
        auth: { username: API_KEY, password: '' }
      }),
      axios.get(`https://www.facturapi.io/v2/invoices/${invoice.id}/xml`, {
        responseType: 'arraybuffer',
        auth: { username: API_KEY, password: '' }
      })
    ]);

    // Convertir a base64 para enviar al frontend
    const pdfBase64 = Buffer.from(pdfRes.data).toString('base64');
    const xmlBase64 = Buffer.from(xmlRes.data).toString('base64');

    res.status(200).json({
      success: true,
      id: invoice.id,
      pdf: `data:application/pdf;base64,${pdfBase64}`,
      xml: `data:application/xml;base64,${xmlBase64}`
    });

  } catch (err) {
    console.error(err.response?.data || err);
    res.status(400).json({ success: false, error: err.response?.data || err.message });
  }
}
