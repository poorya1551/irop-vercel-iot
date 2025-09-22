import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // اگر درخواست از نوع POST بود (یعنی از طرف ESP آمده)
  if (request.method === 'POST') {
    try {
      // وضعیت جدید را از بدنه درخواست بخوان
      const { status } = request.body;
      // آن را در Vercel KV ذخیره کن
      await kv.set('device_status', status);
      // یک پاسخ موفقیت‌آمیز برگردان
      return response.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
      return response.status(500).json({ error: 'Failed to update status' });
    }
  }

  // اگر درخواست از نوع GET بود (یعنی از طرف مرورگر آمده)
  if (request.method === 'GET') {
    try {
      // آخرین وضعیت را از Vercel KV بخوان
      const status = await kv.get('device_status');
      // آن را به عنوان پاسخ برگردان
      return response.status(200).json({ status: status || 'OFF' }); // اگر وضعیتی نبود، خاموش فرض کن
    } catch (error) {
      return response.status(500).json({ error: 'Failed to get status' });
    }
  }

  // اگر متد درخواست پشتیبانی نمی‌شد
  return response.status(405).json({ error: 'Method not allowed' });
}
