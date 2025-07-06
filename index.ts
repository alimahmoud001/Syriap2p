import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderData } = await req.json()

    const emailContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; text-align: center;">طلب جديد - منصة تحويل العملات الرقمية</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af;">المعلومات الشخصية</h3>
          <p><strong>الاسم:</strong> ${orderData.userInfo.name}</p>
          <p><strong>الهاتف:</strong> ${orderData.userInfo.phone}</p>
          <p><strong>المدينة:</strong> ${orderData.userInfo.city}</p>
          <p><strong>نوع العملية:</strong> ${orderData.userInfo.transactionType === 'buy' ? 'شراء' : 'بيع'}</p>
        </div>

        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af;">تفاصيل العملية</h3>
          ${orderData.userInfo.transactionType === 'buy' ? `
            <p><strong>الكمية:</strong> ${orderData.buyOrder.amount} USDT</p>
            <p><strong>الشبكة:</strong> ${orderData.buyOrder.network.toUpperCase()}</p>
            <p><strong>عنوان المحفظة:</strong> ${orderData.buyOrder.address}</p>
            <p><strong>طريقة الدفع:</strong> ${orderData.buyOrder.paymentMethod}</p>
            <p><strong>الملاحظات:</strong> ${orderData.buyOrder.note || 'لا توجد ملاحظات'}</p>
          ` : `
            <p><strong>الكمية:</strong> ${orderData.sellOrder.amount} USDT</p>
            <p><strong>الشبكة:</strong> ${orderData.sellOrder.network.toUpperCase()}</p>
            <p><strong>طريقة الاستلام:</strong> ${orderData.sellOrder.receivingMethod}</p>
            <p><strong>تفاصيل الحساب:</strong> ${orderData.sellOrder.accountDetails}</p>
            <p><strong>الملاحظات:</strong> ${orderData.sellOrder.note || 'لا توجد ملاحظات'}</p>
          `}
        </div>

        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #16a34a;">الملخص المالي</h3>
          <p><strong>عمولة التحويل:</strong> $${orderData.fee.toFixed(2)}</p>
          <p><strong>رسوم الشبكة:</strong> $${orderData.networkFee}</p>
          <p><strong>إجمالي العمولات:</strong> $${orderData.totalFee.toFixed(2)}</p>
          <p><strong>المبلغ ${orderData.userInfo.transactionType === 'buy' ? 'المستحق' : 'الصافي'}:</strong> ${orderData.totalAmount.toLocaleString()} ل.س</p>
        </div>

        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #dc2626; font-weight: bold;">رقم الطلب: #${Date.now().toString().slice(-8)}</p>
          <p style="color: #dc2626;">تاريخ الطلب: ${new Date().toLocaleString('ar-SY')}</p>
        </div>
      </div>
    `

    // إرسال الإيميل باستخدام Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'orders@yourdomain.com',
        to: ['alimahmoud001a@gmail.com'],
        subject: `طلب جديد - ${orderData.userInfo.transactionType === 'buy' ? 'شراء' : 'بيع'} ${orderData.userInfo.transactionType === 'buy' ? orderData.buyOrder.amount : orderData.sellOrder.amount} USDT`,
        html: emailContent,
      }),
    })

    if (!resendResponse.ok) {
      throw new Error('فشل في إرسال الإيميل')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'تم إرسال الطلب بنجاح' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})