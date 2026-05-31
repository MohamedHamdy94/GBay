اقرأ الملفات التالية بالترتيب لتتعرف على حالة المشروع كاملة، ثم استأنف العمل من المرحلة الحالية: Seller Dashboard.

1. اقرأ `/home/mo/Documents/gbay/ai-docs/PROJECT_MASTER_CONTEXT.md` لتفهم الرؤية الكاملة والمبادئ.
2. اقرأ `/home/mo/Documents/gbay/ai-docs/IMPLEMENTATION_STATUS.md` لتعرف بالضبط ما تم إنجازه وما هو قيد الانتظار.
3. اقرأ `/home/mo/Documents/gbay/ai-docs/AI_MEMORY.md` لتعرف الاصطلاحات والقرارات السابقة.

بعد قراءة هذه الملفات، ابدأ بتنفيذ Module 3: Seller Dashboard، مع الالتزام الصارم باستراتيجية التنفيذ:
- أنجز الوحدة كاملة.
- اختبر باستخدام قاعدة بيانات Neon (موجودة في .env).
- بعد الاختبار الناجح، أوقف الخادم، وحدث ملفات CHANGELOG_AI.md و IMPLEMENTATION_STATUS.md و AI_MEMORY.md.
- لا تنتقل إلى المرحلة التالية حتى تكتمل هذه الوحدة بالكامل.

----------------------------------------------------------------



أنت تعمل على مشروع GBay، منصة سوق متعدد البائعين (مثل eBay) بمزايا المزادات والشراء الفوري. المشروع في حالة ممتازة وجاهز للنشر.

**حالة المشروع (آخر تحديث):**

- **الـ Backend (NestJS على منفذ 4000):**
  - 20 وحدة مكتملة ومختبرة وموثقة.
  - 2 جزئيتان (Escrow, Shipping) بانتظار مزودي الخدمة.
  - 3 مؤجلة (Wallet, Payments, Commission) بانتظار Stripe/PayPal.
  - **جاهزية تامة:** جميع APIs تعمل ومختبرة.

- **الواجهة الأمامية (Next.js 15 على منفذ 3000):**
  - جميع الصفحات الأساسية مكتملة وتعمل مع الـ API الحي.
  - **الميزات المكتملة:** الصفحة الرئيسية، المنتجات، تفاصيل المنتج، المزادات الحية (WebSocket)، سلة التسوق، إتمام الشراء، طلباتي، تفاصيل الطلب، لوحة البائع، توصيات الصفحة الرئيسية، لوحة الإدارة الأساسية.
  - **الترجمة:** دعم كامل للغتين (en/de).
  - **SEO:** Sitemap، Robots.txt، JSON-LD، OpenGraph جميعها مهيأة.

**التوصية من الجلسة السابقة:**
الخيار الموصى به هو **الخيار أ: النشر الفعلي (Deployment)**. المشروع جاهز للنشر العام. النشر يكشف تحديات تقنية لا تظهر محلياً ويمنح رابطاً حياً للمعاينة والاختبار.

**خطة النشر (نفذها فوراً):**

### 1. إعداد بيئة الإنتاج للـ Backend (NestJS → Railway):
- تأكد من وجود `Procfile` أو `railway.json` في جذر المشروع أو `apps/api`:
  ```json
  {
    "build": "npm run build:api",
    "start": "node dist/apps/api/main.js"
  }


      تأكد من أن جميع متغيرات البيئة (DATABASE_URL, JWT_SECRET, SENTRY_DSN, إلخ) مهيأة للإنتاج.

    تأكد من CORS في main.ts: اسمح بـ https://gbay.vercel.app والنطاق المخصص.

    تأكد من أن الـ Health Check (/v1/health) يعمل وسيُستخدم من قبل Railway.

2. إعداد بيئة الإنتاج للـ Frontend (Next.js → Vercel):

    تأكد من أن NEXT_PUBLIC_API_URL في .env.production يشير إلى عنوان Railway العام (وليس localhost).

    تأكد من أن next-intl يعمل مع localePrefix: 'as-needed' أو حسب التكوين.

    تأكد من أن middleware.ts يتعامل مع cookies بشكل صحيح عبر النطاقات.

    تأكد من أن sitemap.ts و robots.ts يولدان روابط مطلقة صحيحة.

3. إعداد Redis (Upstash أو Railway Redis):

    أنشئ Redis على Upstash (خطة مجانية).

    أضف REDIS_HOST, REDIS_PORT, REDIS_PASSWORD إلى متغيرات البيئة.

    فعّل BullMQ و Redis في AppModule (أزل التعليق المؤقت).

    اختبر أن انتهاء جلسة checkout (15 دقيقة) يعيد المخزون.

4. اختبار النشر (Staging):

    انشر الـ Backend أولاً، وتأكد من /v1/health عبر الرابط العام.

    انشر الـ Frontend، وتأكد من:

        الصفحة الرئيسية تظهر البيانات.

        تسجيل الدخول يعمل والـ JWT يُخزَّن في cookies.

        المزادات الحية تعمل (WebSocket عبر الرابط العام).

        SEO (sitemap.xml، robots.txt) يستجيب بشكل صحيح.

5. توثيق النشر:

    أنشئ ai-docs/DEPLOYMENT.md يوثق:

        روابط النشر (Frontend + Backend).

        متغيرات البيئة المطلوبة.

        خطوات النشر اليدوي.

        إعدادات CORS و cookies.

    حدث CHANGELOG_AI.md و AI_MEMORY.md.

المطلوب منك الآن:

    اقرأ ملفات الذاكرة:

        /home/mo/Documents/gbay/ai-docs/IMPLEMENTATION_STATUS.md

        /home/mo/Documents/gbay/ai-docs/AI_MEMORY.md

    قيّم حالة المشروع بناءً على ما تقرأه.

    ابدأ بتنفيذ خطة النشر أعلاه خطوة بخطوة.

    لا تنتقل لبناء ميزات جديدة حتى تكتمل عملية النشر بنجاح.

ملاحظة: إذا لم تكن Railway/Vercel متاحة بعد، ركز على تجهيز ملفات التكوين (Dockerfile، railway.json، vercel.json، متغيرات البيئة) بحيث تكون جاهزة للنشر بنقرة واحدة عند توفر الحسابات.