import React, { useState } from 'react';
import { ArrowRightLeft, Copy, CheckCircle, DollarSign, Send, Wallet, User, Phone, MapPin, CreditCard, AlertCircle } from 'lucide-react';

interface UserInfo {
  name: string;
  phone: string;
  city: string;
  transactionType: 'buy' | 'sell' | '';
}

interface BuyOrder {
  amount: number;
  network: string;
  address: string;
  note: string;
  paymentMethod: string;
}

interface SellOrder {
  amount: number;
  network: string;
  receivingMethod: string;
  accountDetails: string;
  note: string;
}

const EXCHANGE_RATE = 10000; // 1 USD = 10000 SYP
const NETWORK_FEES = {
  trc20: 2,
  bep20: 0.15,
  erc20: 0.3,
  binancepay: 0
};

const PAYMENT_METHODS = [
  { id: 'syriatelcash', name: 'سيريتل كاش', address: '0934598967' },
  { id: 'alharam', name: 'حوالة الهرم', address: 'علي ابراهيم محمود\n0934598967\nاللاذقية' },
  { id: 'bemo', name: 'بنك بيمو', address: 'علي ابراهيم محمود\n060104947910013000000' },
  { id: 'shamcash', name: 'شام كاش', address: 'be456e0ea9392db4d68a7093ee317bc8\n5991161126028260' }
];

const CRYPTO_ADDRESSES = {
  bep20: '0x21802218d8d661d66F2C7959347a6382E1cc614F',
  trc20: 'TD2LoErPRkVPBxDk72ZErtiyi6agirZQjX',
  erc20: '0x21802218d8d661d66F2C7959347a6382E1cc614F',
  binancepay: '969755964'
};

function App() {
  const [step, setStep] = useState(1);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    phone: '',
    city: '',
    transactionType: ''
  });
  const [buyOrder, setBuyOrder] = useState<BuyOrder>({
    amount: 0,
    network: '',
    address: '',
    note: '',
    paymentMethod: ''
  });
  const [sellOrder, setSellOrder] = useState<SellOrder>({
    amount: 0,
    network: '',
    receivingMethod: '',
    accountDetails: '',
    note: ''
  });
  const [copiedText, setCopiedText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const calculateFee = (amount: number) => {
    if (amount < 100) return 1.65;
    if (amount <= 5000) return amount * 0.0165;
    return amount * 0.0005;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const fee = calculateFee(userInfo.transactionType === 'buy' ? buyOrder.amount : sellOrder.amount);
      const networkFee = NETWORK_FEES[userInfo.transactionType === 'buy' ? buyOrder.network as keyof typeof NETWORK_FEES : sellOrder.network as keyof typeof NETWORK_FEES];
      const totalFee = fee + networkFee;
      
      const orderData = {
        userInfo,
        buyOrder: userInfo.transactionType === 'buy' ? buyOrder : null,
        sellOrder: userInfo.transactionType === 'sell' ? sellOrder : null,
        fee,
        networkFee,
        totalFee,
        totalAmount: userInfo.transactionType === 'buy' 
          ? (buyOrder.amount + totalFee) * EXCHANGE_RATE
          : (sellOrder.amount - totalFee) * EXCHANGE_RATE,
        timestamp: new Date().toISOString()
      };

      // إرسال الطلب إلى Edge Function
      const response = await fetch('/api/send-order-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderData }),
      });

      if (!response.ok) {
        throw new Error('فشل في إرسال الطلب');
      }

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        setStep(step + 1);
      } else {
        throw new Error(result.error || 'حدث خطأ غير متوقع');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      setSubmitError('فشل في إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setUserInfo({ name: '', phone: '', city: '', transactionType: '' });
    setBuyOrder({ amount: 0, network: '', address: '', note: '', paymentMethod: '' });
    setSellOrder({ amount: 0, network: '', receivingMethod: '', accountDetails: '', note: '' });
    setSubmitted(false);
    setSubmitError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <ArrowRightLeft className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">منصة تحويل العملات الرقمية</h1>
                <p className="text-gray-600">تحويل آمن وسريع لعملة USDT</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <DollarSign className="h-4 w-4" />
              <span>سعر الصرف: 1 USD = {EXCHANGE_RATE.toLocaleString()} ل.س</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className={`flex items-center ${num < 4 ? 'flex-1' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > num ? <CheckCircle className="h-5 w-5" /> : num}
                </div>
                {num < 4 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    step > num ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>المعلومات الشخصية</span>
            <span>نوع العملية</span>
            <span>تفاصيل التحويل</span>
            <span>التأكيد</span>
          </div>
        </div>

        {/* Step 1: User Information */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">المعلومات الشخصية</h2>
              <p className="text-gray-600">يرجى إدخال معلوماتك الشخصية للمتابعة</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-2" />
                  الاسم الثلاثي
                </label>
                <input
                  type="text"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل اسمك الثلاثي"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-2" />
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل رقم هاتفك"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-2" />
                  المدينة
                </label>
                <input
                  type="text"
                  value={userInfo.city}
                  onChange={(e) => setUserInfo({ ...userInfo, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل مدينتك"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع العملية</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setUserInfo({ ...userInfo, transactionType: 'buy' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      userInfo.transactionType === 'buy'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <div className="text-center">
                      <Wallet className="h-8 w-8 mx-auto mb-2" />
                      <span className="font-semibold">شراء USDT</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setUserInfo({ ...userInfo, transactionType: 'sell' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      userInfo.transactionType === 'sell'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-red-300'
                    }`}
                  >
                    <div className="text-center">
                      <Send className="h-8 w-8 mx-auto mb-2" />
                      <span className="font-semibold">بيع USDT</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!userInfo.name || !userInfo.phone || !userInfo.city || !userInfo.transactionType}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Buy Flow */}
        {step === 2 && userInfo.transactionType === 'buy' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">شراء USDT</h2>
              <p className="text-gray-600">أدخل تفاصيل عملية الشراء</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكمية المطلوبة (USDT)</label>
                <input
                  type="number"
                  value={buyOrder.amount}
                  onChange={(e) => setBuyOrder({ ...buyOrder, amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل الكمية"
                  min="1"
                />
                {buyOrder.amount > 0 && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      العمولة: ${calculateFee(buyOrder.amount).toFixed(2)} USDT
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اختر الشبكة</label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(NETWORK_FEES).map(([network, fee]) => (
                    <button
                      key={network}
                      onClick={() => setBuyOrder({ ...buyOrder, network })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        buyOrder.network === network
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-center">
                        <span className="font-semibold block uppercase">{network}</span>
                        <span className="text-sm text-gray-500">رسوم الشبكة: ${fee}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عنوان المحفظة</label>
                <input
                  type="text"
                  value={buyOrder.address}
                  onChange={(e) => setBuyOrder({ ...buyOrder, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل عنوان محفظتك"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدفع</label>
                <select
                  value={buyOrder.paymentMethod}
                  onChange={(e) => setBuyOrder({ ...buyOrder, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">اختر طريقة الدفع</option>
                  {PAYMENT_METHODS.map(method => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={buyOrder.note}
                  onChange={(e) => setBuyOrder({ ...buyOrder, note: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="أدخل أي ملاحظات إضافية"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                السابق
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!buyOrder.amount || !buyOrder.network || !buyOrder.address || !buyOrder.paymentMethod}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Sell Flow */}
        {step === 2 && userInfo.transactionType === 'sell' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">بيع USDT</h2>
              <p className="text-gray-600">أدخل تفاصيل عملية البيع</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكمية المراد بيعها (USDT)</label>
                <input
                  type="number"
                  value={sellOrder.amount}
                  onChange={(e) => setSellOrder({ ...sellOrder, amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل الكمية"
                  min="1"
                />
                {sellOrder.amount > 0 && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      العمولة: ${calculateFee(sellOrder.amount).toFixed(2)} USDT
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الاستلام</label>
                <select
                  value={sellOrder.receivingMethod}
                  onChange={(e) => setSellOrder({ ...sellOrder, receivingMethod: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">اختر طريقة الاستلام</option>
                  <option value="syriatelcash">سيريتل كاش</option>
                  <option value="alharam">حوالة الهرم</option>
                  <option value="bemo">بنك بيمو</option>
                  <option value="shamcash">شام كاش</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {sellOrder.receivingMethod === 'syriatelcash' && 'رقم الهاتف'}
                  {sellOrder.receivingMethod === 'alharam' && 'رقم الهاتف'}
                  {sellOrder.receivingMethod === 'bemo' && 'رقم الحساب البنكي'}
                  {sellOrder.receivingMethod === 'shamcash' && 'رقم الحساب أو عنوان الحساب'}
                  {!sellOrder.receivingMethod && 'تفاصيل الحساب'}
                </label>
                <input
                  type="text"
                  value={sellOrder.accountDetails}
                  onChange={(e) => setSellOrder({ ...sellOrder, accountDetails: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل تفاصيل حسابك"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اختر الشبكة لإرسال USDT</label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(NETWORK_FEES).map(([network, fee]) => (
                    <button
                      key={network}
                      onClick={() => setSellOrder({ ...sellOrder, network })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        sellOrder.network === network
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-center">
                        <span className="font-semibold block uppercase">{network}</span>
                        <span className="text-sm text-gray-500">رسوم الشبكة: ${fee}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={sellOrder.note}
                  onChange={(e) => setSellOrder({ ...sellOrder, note: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="أدخل أي ملاحظات إضافية"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                السابق
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!sellOrder.amount || !sellOrder.receivingMethod || !sellOrder.accountDetails || !sellOrder.network}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment/Transfer Details */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {userInfo.transactionType === 'buy' ? 'تفاصيل الدفع' : 'تفاصيل الإرسال'}
              </h2>
              <p className="text-gray-600">
                {userInfo.transactionType === 'buy' 
                  ? 'استخدم التفاصيل التالية لإرسال الدفعة'
                  : 'أرسل USDT إلى العنوان التالي'
                }
              </p>
            </div>
            
            {userInfo.transactionType === 'buy' ? (
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4">تفاصيل الدفع - {PAYMENT_METHODS.find(p => p.id === buyOrder.paymentMethod)?.name}</h3>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {PAYMENT_METHODS.find(p => p.id === buyOrder.paymentMethod)?.address}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(PAYMENT_METHODS.find(p => p.id === buyOrder.paymentMethod)?.address || '')}
                        className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        {copiedText === PAYMENT_METHODS.find(p => p.id === buyOrder.paymentMethod)?.address ? 
                          <CheckCircle className="h-4 w-4" /> : 
                          <Copy className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-4">ملخص المبلغ المستحق</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>المبلغ الأساسي:</span>
                      <span>{buyOrder.amount} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عمولة التحويل:</span>
                      <span>${calculateFee(buyOrder.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>رسوم الشبكة ({buyOrder.network.toUpperCase()}):</span>
                      <span>${NETWORK_FEES[buyOrder.network as keyof typeof NETWORK_FEES]}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>المبلغ الكلي:</span>
                        <span>{((buyOrder.amount + calculateFee(buyOrder.amount) + NETWORK_FEES[buyOrder.network as keyof typeof NETWORK_FEES]) * EXCHANGE_RATE).toLocaleString()} ل.س</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-4">عنوان الإرسال - {sellOrder.network.toUpperCase()}</h3>
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-gray-700 break-all">
                        {CRYPTO_ADDRESSES[sellOrder.network as keyof typeof CRYPTO_ADDRESSES]}
                      </code>
                      <button
                        onClick={() => copyToClipboard(CRYPTO_ADDRESSES[sellOrder.network as keyof typeof CRYPTO_ADDRESSES])}
                        className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        {copiedText === CRYPTO_ADDRESSES[sellOrder.network as keyof typeof CRYPTO_ADDRESSES] ? 
                          <CheckCircle className="h-4 w-4" /> : 
                          <Copy className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-4">ملخص المبلغ المستلم</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>المبلغ الأساسي:</span>
                      <span>{sellOrder.amount} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>عمولة التحويل:</span>
                      <span>-${calculateFee(sellOrder.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>رسوم الشبكة ({sellOrder.network.toUpperCase()}):</span>
                      <span>-${NETWORK_FEES[sellOrder.network as keyof typeof NETWORK_FEES]}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>المبلغ الصافي:</span>
                        <span>{((sellOrder.amount - calculateFee(sellOrder.amount) - NETWORK_FEES[sellOrder.network as keyof typeof NETWORK_FEES]) * EXCHANGE_RATE).toLocaleString()} ل.س</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                السابق
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                تأكيد الطلب
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">تأكيد الطلب</h2>
              <p className="text-gray-600">راجع تفاصيل طلبك قبل الإرسال</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">المعلومات الشخصية</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">الاسم:</span> {userInfo.name}</p>
                    <p><span className="font-medium">الهاتف:</span> {userInfo.phone}</p>
                    <p><span className="font-medium">المدينة:</span> {userInfo.city}</p>
                    <p><span className="font-medium">نوع العملية:</span> {userInfo.transactionType === 'buy' ? 'شراء' : 'بيع'}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">تفاصيل العملية</h3>
                  <div className="space-y-1 text-sm">
                    {userInfo.transactionType === 'buy' ? (
                      <>
                        <p><span className="font-medium">الكمية:</span> {buyOrder.amount} USDT</p>
                        <p><span className="font-medium">الشبكة:</span> {buyOrder.network.toUpperCase()}</p>
                        <p><span className="font-medium">العنوان:</span> {buyOrder.address.substring(0, 20)}...</p>
                        <p><span className="font-medium">طريقة الدفع:</span> {PAYMENT_METHODS.find(p => p.id === buyOrder.paymentMethod)?.name}</p>
                      </>
                    ) : (
                      <>
                        <p><span className="font-medium">الكمية:</span> {sellOrder.amount} USDT</p>
                        <p><span className="font-medium">الشبكة:</span> {sellOrder.network.toUpperCase()}</p>
                        <p><span className="font-medium">طريقة الاستلام:</span> {sellOrder.receivingMethod}</p>
                        <p><span className="font-medium">تفاصيل الحساب:</span> {sellOrder.accountDetails}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">تنبيه مهم</h3>
                    <p className="text-sm text-yellow-800">
                      {userInfo.transactionType === 'buy' 
                        ? 'يرجى إرسال المبلغ المطلوب بدقة إلى تفاصيل الدفع المحددة. سيتم تحويل USDT بعد تأكيد الدفع.'
                        : 'يرجى إرسال USDT إلى العنوان المحدد. سيتم تحويل المبلغ إلى حسابك بعد تأكيد الاستلام.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1">خطأ</h3>
                      <p className="text-sm text-red-800">{submitError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                السابق
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    إرسال الطلب
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {step === 5 && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">تم إرسال الطلب بنجاح!</h2>
              <p className="text-gray-600">
                تم إرسال طلبك إلى البريد الإلكتروني وسيتم التواصل معك قريباً لتأكيد العملية.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">ملخص الطلب</h3>
                <div className="text-sm text-green-800">
                  <p>رقم الطلب: #{Date.now().toString().slice(-6)}</p>
                  <p>النوع: {userInfo.transactionType === 'buy' ? 'شراء' : 'بيع'}</p>
                  <p>المبلغ: {userInfo.transactionType === 'buy' ? buyOrder.amount : sellOrder.amount} USDT</p>
                  <p>الحالة: في انتظار المعالجة</p>
                </div>
              </div>
              
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                طلب جديد
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;