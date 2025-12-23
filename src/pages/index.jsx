import React from "react";
import Head from "next/head";
import Header from "../components/layout/Header/Header";
import Footer from "../components/layout/Footer/Footer";

const HomePage = () => {
  const meta = {
    title: "مهر سلیمان | سولی لرنو",
    description:
      "نسخه نمایشی صفحه اصلی مهر سلیمان برای ارائه تجربه آموزشی سولی لرنو بدون اتصال به سرویس یا پرداخت واقعی.",
  };

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href="/" />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="website" />
      </Head>

      <Header />

      <main id="main-content">
        <section id="hero-ads-slider" aria-label="اسلایدر و باکس‌های نمایشی">
          <div className="container">
            <p className="eyebrow">سولی لرنو</p>
            <h1>مهر سلیمان</h1>
            <h2>ویترین اولیه صفحه اصلی</h2>
            <p>
              این بخش برای جای‌گذاری اسلایدر عریض و شبکه ۲x۲ بنر تبلیغاتی در نسخه
              نهایی استفاده خواهد شد.
            </p>
          </div>
        </section>

        <section id="category-circles" aria-label="دسته‌بندی‌های آموزشی">
          <div className="container">
            <h2>دسته‌بندی‌های محبوب</h2>
            <p>جایگاه دایره‌های دسته‌بندی برای مرور سریع مسیرهای آموزشی.</p>
          </div>
        </section>

        <section id="double-banners" aria-label="دو بنر ویژه">
          <div className="container">
            <h2>دو بنر ویژه</h2>
            <p>دو بنر عریض برای کمپین‌های نمایشی در نمای دسکتاپ و موبایل.</p>
          </div>
        </section>

        <section id="best-sellers" aria-label="پرفروش‌ترین‌ها">
          <div className="container">
            <h2>پرفروش‌ترین‌ها</h2>
            <p>ریل افقی محصولات محبوب با نشان تخفیف و قیمت در نسخه بعدی.</p>
          </div>
        </section>

        <section id="newest" aria-label="جدیدترین‌ها">
          <div className="container">
            <h2>جدیدترین‌ها</h2>
            <p>ریل افقی محصولات تازه اضافه‌شده با رنگ‌بندی متفاوت.</p>
          </div>
        </section>

        <section id="top-centers" aria-label="محبوب‌ترین مراکز آموزشی">
          <div className="container">
            <h2>محبوب‌ترین مراکز آموزشی</h2>
            <p>جایگاه لوگو مراکز آموزشی با اسکرول افقی.</p>
          </div>
        </section>

        <section id="about-solico" aria-label="درباره سولی لرنو">
          <div className="container">
            <h2>درباره سولیکو</h2>
            <p>
              معرفی کوتاه سولیکو به صورت متنی و تصویر نمایشی؛ در این مرحله تنها
              اسکلت معنایی آماده شده است.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default HomePage;
