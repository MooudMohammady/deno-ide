# Web IDE — مستندات پروژه

**نام پروژه:** deno-ide (Web IDE)  
**نسخه:** 0.2.0  
**نوع:** محیط توسعه یکپارچه (IDE) مبتنی بر وب

---

## فهرست مطالب

1. [معرفی پروژه](#۱-معرفی-پروژه)
2. [اهداف و انگیزه](#۲-اهداف-و-انگیزه)
3. [قابلیت‌ها](#۳-قابلیت‌ها)
4. [تکنولوژی‌های استفاده‌شده](#۴-تکنولوژی‌های-استفاده‌شده)
5. [معماری سیستم](#۵-معماری-سیستم)
6. [ساختار پروژه](#۶-ساختار-پروژه)
7. [نحوه اجرا](#۷-نحوه-اجرا)
8. [راهنمای استفاده](#۸-راهنمای-استفاده)
9. [API سمت سرور](#۹-api-سمت-سرور)
10. [جریان داده (Data Flow)](#۱۰-جریان-داده)
11. [محدودیت‌ها و کارهای آینده](#۱۱-محدودیت‌ها-و-کارهای-آینده)
12. [تست و کیفیت کد](#۱۲-تست-و-کیفیت-کد)

---

## ۱. معرفی پروژه

**Web IDE** یک محیط توسعه یکپارچه (Integrated Development Environment) است که کاملاً در مرورگر اجرا می‌شود. این پروژه با الهام از ویرایشگرهایی مانند Visual Studio Code طراحی شده و امکان ویرایش کد، مدیریت فایل، اجرای دستورات در ترمینال، بررسی خطاهای کد (Linting) و امکانات جانبی دیگر را در یک رابط کاربری واحد فراهم می‌کند.

برخلاف IDEهای دسکتاپی، این پروژه نیازی به نصب نرم‌افزار جداگانه ندارد؛ کافی است سرور توسعه اجرا شود و کاربر از طریق مرورگر به آدرس `http://localhost:3000` متصل شود.

---

## ۲. اهداف و انگیزه

| هدف | توضیح |
|-----|-------|
| دسترسی از هر مرورگر | امکان کدنویسی بدون نصب IDE روی سیستم |
| شبیه‌سازی تجربه VS Code | منو، سایدبار، تب‌ها، ترمینال و پنل دیباگ |
| مدیریت فایل واقعی | ذخیره و خواندن فایل‌ها روی دیسک سرور |
| اجرای کد | اجرای فایل‌های Python و JavaScript از طریق ترمینال |
| قابلیت توسعه | معماری ماژولار برای افزودن افزونه و قابلیت‌های جدید |

---

## ۳. قابلیت‌ها

### ۳.۱ ویرایشگر کد (Code Editor)

- مبتنی بر **Monaco Editor** (همان موتور VS Code)
- **Syntax Highlighting** برای زبان‌های متعدد: TypeScript، JavaScript، Python، HTML، CSS، JSON، Markdown، Go، Rust، Java و ...
- تشخیص خودکار زبان بر اساس پسوند فایل
- پشتیبانی از تم تاریک (Dark) و روشن (Light)
- تنظیمات قابل تغییر: اندازه فونت، اندازه Tab، Word Wrap، Minimap
- چند تب همزمان برای فایل‌های باز
- نمایش موقعیت کرسر در Status Bar

### ۳.۲ مدیریت فایل (File Explorer)

- نمایش درختی فایل‌ها و پوشه‌ها
- ایجاد فایل و پوشه جدید
- حذف و تغییر نام
- ذخیره تغییرات روی سرور (پروژه پیش‌فرض در پوشه `projects/default/`)
- **باز کردن فایل/پوشه محلی** از سیستم کاربر (File System Access API یا input مرورگر)
- آپلود فایل به سرور

### ۳.۳ ترمینال (Terminal)

- ترمینال تعاملی با اجرای دستورات **سمت سرور**
- پشتیبانی از دستورات:
  - `python filename.py` — اجرای فایل Python
  - `node filename.js` — اجرای فایل Node.js
  - `ls` / `dir` — لیست فایل‌ها
  - `cd`, `pwd`, `cat`, `mkdir`, `touch`, `rm`, `echo`, `help`, `clear`
- چند session ترمینال همزمان
- تاریخچه دستورات (Arrow Up/Down)

### ۳.۴ Linting و Problems Panel

- بررسی خودکار کد هنگام تایپ (با Debounce ۵۰۰ms)
- قوانین نمونه:
  - هشدار برای `console.log`
  - خطا برای `debugger;`
  - هشدار برای استفاده از `var`
  - اطلاع برای فاصله انتهای خط (Trailing whitespace)
- نمایش تعداد خطا و هشدار در Status Bar و تب Problems

### ۳.۵ Git (شبیه‌سازی)

- پنل Git با نمایش فایل‌های staged، unstaged و untracked
- Stage / Unstage فایل
- Commit با پیام
- ایجاد و تعویض Branch

> **توجه:** Git در حال حاضر به صورت **In-Memory** (در حافظه مرورگر) پیاده‌سازی شده و به مخزن Git واقعی متصل نیست.

### ۳.۶ Debugger (شبیه‌سازی)

- پنل Debug با کنترل‌های Start، Stop، Continue
- Step Over، Step Into، Step Out
- مدیریت Breakpoint

> **توجه:** دیباگر فعلاً **شبیه‌سازی‌شده** است و به runtime واقعی (مثل Node Inspector) متصل نیست.

### ۳.۷ Marketplace افزونه‌ها

- فهرست افزونه‌های نمونه (Prettier، ESLint، GitLens، One Dark Pro)
- نصب، حذف و فعال/غیرفعال کردن

> **توجه:** افزونه‌ها فعلاً فقط در UI مدیریت می‌شوند و رفتار واقعی ویرایشگر را تغییر نمی‌دهند.

### ۳.۸ تنظیمات (Settings)

- تم، فونت، Tab، Word Wrap، Minimap
- ذخیره خودکار در `localStorage` مرورگر
- بازنشانی به پیش‌فرض

### ۳.۹ منوی اصلی (Menu Bar)

منوهای File، Edit، View، Run، Terminal و Help با میانبرهای کیبورد استاندارد (مانند Ctrl+S برای Save، Ctrl+B برای Sidebar).

---

## ۴. تکنولوژی‌های استفاده‌شده

| لایه | تکنولوژی | نقش |
|------|----------|-----|
| Framework | **Next.js 16** (App Router) | فریم‌ورک React با SSR و API Routes |
| UI | **React 19** | رابط کاربری |
| Styling | **Tailwind CSS 4** | استایل‌دهی |
| Editor | **Monaco Editor** | ویرایشگر کد |
| Terminal UI | **xterm.js** | (در برخی کامپوننت‌ها) |
| Language | **TypeScript 5** | تایپ‌امن |
| Runtime (Server) | **Node.js** | API و اجرای دستورات |
| Testing | **Jest** + Testing Library | تست واحد |

---

## ۵. معماری سیستم

```
┌─────────────────────────────────────────────────────────────┐
│                     مرورگر (Client)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ MenuBar  │  │ Explorer │  │ CodeEditor│  │  Terminal   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │
│       │             │             │                │         │
│       └─────────────┴────── IDELayout ────────────┘         │
│                          (React Hooks)                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP (fetch)
┌──────────────────────────────▼──────────────────────────────┐
│                   Next.js Server (Node.js)                   │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  /api/files         │    │  /api/terminal/execute       │ │
│  │  CRUD فایل‌ها       │    │  spawn(python/node/shell)   │ │
│  └──────────┬──────────┘    └──────────────┬──────────────┘ │
│             │                               │                │
│             ▼                               ▼                │
│      projects/default/              child_process            │
│      (فایل‌سیستم دیسک)              (Python, Node, CMD/Bash)  │
└─────────────────────────────────────────────────────────────┘
```

### الگوی طراحی

- **Component-Based Architecture:** هر بخش IDE یک کامپوننت React مستقل است.
- **Custom Hooks:** منطق business در hookهای جداگانه (`useFileSystem`, `useGit`, `useDebugger`, ...) قرار دارد.
- **Client/Server Split:** عملیات فایل و ترمینال از API Routes سمت سرور انجام می‌شود؛ UI کاملاً client-side است.

---

## ۶. ساختار پروژه

```
deno-ide/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # صفحه اصلی → IDELayout
│   ├── layout.tsx                # Layout کلی
│   ├── globals.css               # استایل‌های سراسری
│   └── api/
│       ├── files/route.ts        # API مدیریت فایل
│       └── terminal/execute/route.ts  # API اجرای دستور
│
├── components/ide/               # کامپوننت‌های IDE
│   ├── IDELayout.tsx             # چیدمان اصلی و orchestration
│   ├── MenuBar.tsx               # نوار منو
│   ├── types.ts                  # TypeScript interfaces
│   ├── editor/                   # ویرایشگر و تب‌ها
│   ├── explorer/                 # File Explorer
│   ├── terminal/                 # ترمینال
│   ├── git/                      # پنل Git
│   ├── debugger/                 # پنل Debug
│   ├── extensions/               # Marketplace
│   ├── analysis/                 # Linting و Problems
│   └── settings/                 # تنظیمات
│
├── lib/                          # سرویس‌های کمکی
│   ├── fileSystem.ts             # توابع in-memory (legacy/demo)
│   ├── linting.ts                # قوانین lint
│   ├── formatter.ts              # فرمت کد
│   ├── codeMetrics.ts            # متریک‌های کد
│   └── debounce.ts               # Debounce utility
│
├── projects/                     # (ایجاد خودکار) پروژه‌های کاربر
│   └── default/                  # پروژه نمونه
│       ├── hello.py
│       ├── app.py
│       ├── index.js
│       └── README.md
│
├── public/                       # فایل‌های استاتیک
├── package.json
├── tsconfig.json
├── next.config.ts
└── jest.config.ts
```

---

## ۷. نحوه اجرا

### پیش‌نیازها

| نرم‌افزار | نسخه پیشنهادی | ضرورت |
|-----------|---------------|-------|
| Node.js | 18+ | **الزامی** |
| npm | 9+ | **الزامی** |
| Python | 3.x | برای اجرای فایل‌های `.py` |
| Git | — | اختیاری (برای clone) |

### نصب و اجرا

```bash
# 1. کلون یا دانلود پروژه
cd deno-ide

# 2. نصب وابستگی‌ها
npm install

# 3. اجرای سرور توسعه
npm run dev
```

سپس مرورگر را باز کنید و به آدرس زیر بروید:

```
http://localhost:3000
```

### دستورات دیگر

```bash
npm run build    # ساخت نسخه Production
npm run start    # اجرای نسخه Production (بعد از build)
npm run lint     # بررسی ESLint
npm run test     # اجرای تست‌های Jest
```

### اولین اجرا

در اولین بار، پوشه `projects/default/` به‌صورت خودکار ساخته می‌شود و فایل‌های نمونه (`hello.py`, `app.py`, `index.js`, `README.md`) در آن قرار می‌گیرند.

---

## ۸. راهنمای استفاده

### ۸.۱ شروع سریع

1. پروژه را اجرا کنید (`npm run dev`)
2. در سایدبار چپ، فایل `hello.py` را باز کنید
3. در پنل پایین، تب **Terminal** را انتخاب کنید
4. دستور زیر را وارد کنید:

```bash
python hello.py
```

5. خروجی برنامه در ترمینال نمایش داده می‌شود.

### ۸.۲ میانبرهای کیبورد

| میانبر | عملکرد |
|--------|--------|
| `Ctrl+S` | ذخیره فایل فعال |
| `Ctrl+Shift+S` | ذخیره همه فایل‌ها |
| `Ctrl+B` | نمایش/مخفی Sidebar |
| `Ctrl+`` ` | نمایش/مخفی Terminal |
| `Ctrl+W` | بستن تب فعال |
| `F5` | Run (شروع Debug session) |

### ۸.۳ باز کردن پوشه محلی

از منوی **File → Open Folder** می‌توانید پوشه‌ای از سیستم خود را باز کنید. در مرورگرهای Chromium (Chrome, Edge) از File System Access API استفاده می‌شود و تغییرات مستقیماً روی دیسک ذخیره می‌شوند.

### ۸.۴ مشاهده خطاهای کد

- هنگام ویرایش، lint به‌صورت خودکار اجرا می‌شود
- تب **Problems** در پنل پایین، لیست خطاها و هشدارها را نشان می‌دهد

---

## ۹. API سمت سرور

### ۹.۱ `/api/files`

**GET** — خواندن درخت فایل یا محتوای یک فایل

```
GET /api/files?projectId=default&path=/
```

**POST** — عملیات CRUD

| action | توضیح | پارامترها |
|--------|-------|-----------|
| `createFile` | ایجاد فایل | `path`, `content` |
| `createDirectory` | ایجاد پوشه | `path` |
| `updateFile` | به‌روزرسانی محتوا | `path`, `content` |
| `delete` | حذف فایل/پوشه | `path` |
| `rename` | تغییر نام | `path`, `newName` |
| `upload` | آپلود فایل | `path`, `content` |
| `importFiles` | import چند فایل | `files[]` |

### ۹.۲ `/api/terminal/execute`

**POST** — اجرای دستور

```json
{
  "command": "python hello.py",
  "projectId": "default",
  "cwd": "/optional/working/directory"
}
```

**پاسخ:**

```json
{
  "success": true,
  "output": "Hello, World!\n...",
  "error": ""
}
```

> **امنیت:** مسیر کاری (cwd) به داخل پوشه پروژه محدود می‌شود تا از دسترسی به فایل‌های خارج از پروژه جلوگیری شود.

---

## ۱۰. جریان داده

### باز کردن فایل

```
User click → FileExplorer → handleFileOpen()
  → getContent(fileId) → GET /api/files
  → setFileContents → CodeEditor render
```

### ذخیره فایل

```
Ctrl+S → handleSaveFile()
  → updateContent(fileId, content) → POST /api/files (updateFile)
  → dirty flag = false
```

### اجرای دستور ترمینال

```
User Enter → RealTerminal → executeCommand()
  → POST /api/terminal/execute
  → spawn(python/node/shell) on server
  → output returned → display in terminal
```

---

## ۱۱. محدودیت‌ها و کارهای آینده

### محدودیت‌های فعلی

| بخش | وضعیت |
|-----|-------|
| Git | شبیه‌سازی In-Memory — بدون اتصال به Git واقعی |
| Debugger | شبیه‌سازی UI — بدون breakpoint واقعی در runtime |
| Extensions | فقط UI — بدون hook به Monaco |
| Undo/Redo در منو | Log-only — Monaco خودش undo دارد |
| Find/Replace در منو | Log-only — Monaco خودش search دارد |
| ترمینال | Request/Response — نه PTY تعاملی real-time |
| Multi-user | تک کاربر — بدون authentication |

### پیشنهاد توسعه آینده

- اتصال Git به `simple-git` یا اجرای دستورات git واقعی
- Debugger واقعی با `node --inspect` یا `debugpy`
- WebSocket برای ترمینال تعاملی
- سیستم افزونه با Monaco contribution API
- Authentication و پروژه‌های چندکاربره
- Deploy روی Vercel/Docker

---

## ۱۲. تست و کیفیت کد

```bash
npm run test     # Jest
npm run lint     # ESLint (eslint-config-next)
```

پروژه از TypeScript برای type safety و ESLint برای کیفیت کد استفاده می‌کند.

---

## خلاصه برای ارزیابی

این پروژه یک **Web IDE کامل از نظر UI/UX** است که:

- ✅ ویرایش کد با Monaco Editor و syntax highlighting
- ✅ مدیریت فایل واقعی روی سرور
- ✅ ترمinal با اجرای Python/Node/shell
- ✅ Linting و Problems panel
- ✅ معماری ماژولار و قابل توسعه
- ⚠️ Git، Debugger و Extensions در سطح UI/شبیه‌سازی

---

*تهیه‌شده برای ارائه به استاد — Web IDE v0.2.0*
