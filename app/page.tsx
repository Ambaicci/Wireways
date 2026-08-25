"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const space = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"] });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

const baseRates = [
  { pair: "USD / KES", base: 129.45, decimals: 2 },
  { pair: "EUR / USD", base: 1.0892, decimals: 4 },
  { pair: "GBP / USD", base: 1.2704, decimals: 4 },
  { pair: "USD / USDC", base: 1.0001, decimals: 4 },
];

export default function LandingPage() {
  const [rates, setRates] = useState(() => baseRates.map((r) => ({ ...r, value: r.base, up: true })));
  const [activeTab, setActiveTab] = useState("marketplaces");

  useEffect(() => {
    const interval = setInterval(() => {
      setRates((prev) =>
        prev.map((r) => {
          const delta = (Math.random() - 0.5) * 0.002 * r.base;
          return { ...r, value: r.base + delta, up: delta >= 0 };
        })
      );
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const revealEls = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{`
        :root{
          --paper:#F6F5F3; --surface:#FFFFFF; --ink:#18140F; --ink-soft:#4E4841; --muted:#8C8579; --muted-2:#B3AC9F; --border:#EAE6DF;
          --brand:#F1622C; --brand-dark:#C94A1D; --brand-soft:#FDEBE0;
          --data:#4C5C88; --data-2:#8791B3; --data-soft:#EAEDF5;
          --positive:#17824A; --positive-bright:#4CC38A; --warn:#9C6B08;
          --dark:#0E1116; --dark-2:#151922; --dark-border:rgba(255,255,255,0.08); --dark-muted:#8791B3;
        }
        *{box-sizing:border-box; margin:0; padding:0;}
        html{ scroll-behavior:smooth; }
        body{ font-family:${inter.style.fontFamily},sans-serif; background:var(--paper); color:var(--ink); -webkit-font-smoothing:antialiased; }
        a{ color:inherit; text-decoration: none; }
        .wrap{ max-width:1120px; margin:0 auto; padding:0 24px; }
        img{ max-width:100%; display:block; }
        .reveal{ opacity:0; transform:translateY(18px); transition: opacity .6s ease, transform .6s ease; }
        .reveal.visible{ opacity:1; transform:translateY(0); }

        header.nav{ position:fixed; top:0; left:0; right:0; z-index:100; background:rgba(14,17,22,0.72); backdrop-filter: blur(16px); border-bottom:1px solid var(--dark-border); }
        .nav-inner{ max-width:1120px; margin:0 auto; padding:0 24px; height:64px; display:flex; align-items:center; justify-content:space-between; color:#fff; }
        .brand{ display:flex; align-items:center; gap:10px; }
        .brand-mark{ width:30px; height:30px; border-radius:9px; background:var(--brand); display:flex; align-items:center; justify-content:center; }
        .brand-mark svg{ width:16px; height:16px; }
        .brand-name{ font-family:${space.style.fontFamily},sans-serif; font-weight:600; font-size:16px; }
        .nav-links{ display:flex; align-items:center; gap:28px; }
        .nav-links a.nav-item{ font-size:13px; font-weight:500; color:var(--dark-muted); transition:color .15s ease; }
        .nav-links a.nav-item:hover{ color:#fff; }
        .nav-cta{ display:flex; align-items:center; gap:16px; }
        .btn-ghost{ font-size:13px; font-weight:500; color:var(--dark-muted); }
        .btn-ghost:hover{ color:#fff; }
        .btn-brand{ display:inline-flex; align-items:center; gap:7px; background:var(--brand); color:#fff; font-size:13px; font-weight:600; padding:9px 16px; border-radius:10px; transition: background .15s ease, transform .15s ease; }
        .btn-brand:hover{ background:var(--brand-dark); transform:translateY(-1px); }
        .btn-brand svg{ width:14px; height:14px; }
        @media (max-width:860px){ .nav-links{ display:none; } }

        .hero{ position:relative; overflow:hidden; background:var(--dark); color:#fff; padding:150px 0 90px; }
        .hero::before{ content:''; position:absolute; top:-25%; left:-12%; width:600px; height:600px; background:var(--brand); opacity:0.16; border-radius:50%; filter:blur(140px); animation: driftA 13s ease-in-out infinite; }
        .hero::after{ content:''; position:absolute; bottom:-32%; right:-10%; width:520px; height:520px; background:var(--data); opacity:0.22; border-radius:50%; filter:blur(120px); animation: driftB 15s ease-in-out infinite; }
        @keyframes driftA{ 0%,100%{ transform:translate(0,0); } 50%{ transform:translate(40px,30px); } }
        @keyframes driftB{ 0%,100%{ transform:translate(0,0); } 50%{ transform:translate(-30px,-40px); } }
        .grid-overlay{ position:absolute; inset:0; opacity:0.05; pointer-events:none; background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg,#fff 1px, transparent 1px); background-size:56px 56px; }
        .hero-inner{ position:relative; max-width:840px; margin:0 auto; padding:0 24px; text-align:center; }
        .eyebrow{ font-family:${plex.style.fontFamily},monospace; font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:var(--dark-muted); margin-bottom:22px; }
        .hero h1{ font-family:${space.style.fontFamily},sans-serif; font-weight:600; font-size:64px; line-height:1.04; letter-spacing:-0.02em; margin:0 auto; }
        .hero h1 .word{ display:inline-block; opacity:0; transform:translateY(18px); animation: wordIn .6s ease forwards; margin-right:0.24em; }
        .hero h1 .accent{ color:var(--brand); }
        @keyframes wordIn{ to{ opacity:1; transform:translateY(0); } }
        .hero-sub{ color:var(--dark-muted); font-size:16.5px; line-height:1.65; max-width:480px; margin:24px auto 0; opacity:0; animation: fadeUp .6s ease forwards; animation-delay:0.55s; }
        @keyframes fadeUp{ from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:translateY(0); } }
        .hero-cta{ display:flex; gap:12px; margin-top:36px; flex-wrap:wrap; opacity:0; animation: fadeUp .6s ease forwards; animation-delay:0.7s; justify-content:center; }
        .hero-cta .btn-brand{ padding:13px 22px; font-size:14px; border-radius:12px; box-shadow:0 12px 30px rgba(241,98,44,0.28); }
        .btn-outline{ display:inline-flex; align-items:center; gap:7px; border:1px solid rgba(255,255,255,0.16); color:#fff; font-size:14px; font-weight:600; padding:13px 22px; border-radius:12px; transition: all .15s ease; }
        .btn-outline:hover{ border-color:rgba(255,255,255,0.4); transform:translateY(-1px); }
        .trust-row{ display:flex; align-items:center; justify-content:center; gap:22px; flex-wrap:wrap; margin-top:34px; opacity:0; animation: fadeUp .6s ease forwards; animation-delay:0.85s; }
        .trust-row .stars{ display:flex; align-items:center; gap:6px; font-size:13px; color:var(--dark-muted); }
        .trust-row .stars svg{ width:13px; height:13px; color:#F5B23A; }
        .trust-divider{ width:1px; height:14px; background:var(--dark-border); }
        .trust-row .stat{ font-size:13px; color:var(--dark-muted); }
        .trust-row .stat b{ color:#fff; font-weight:600; }
        .hero-visual{ position:relative; max-width:1120px; margin:64px auto 0; padding:0 24px 130px; opacity:0; animation: fadeUp .7s ease forwards; animation-delay:0.9s; }
        .hero-photo-frame{ border-radius:28px; overflow:hidden; height:440px; position:relative; }
        .hero-photo-frame img{ width:100%; height:100%; object-fit:cover; display:block; }
        .hero-photo-frame::after{ content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(14,17,22,0) 40%, rgba(14,17,22,0.55) 100%); }
        .live-panel{ position:absolute; left:50%; bottom:0; transform:translateX(-50%); width:calc(100% - 48px); max-width:860px; border:1px solid var(--dark-border); background:rgba(21,25,34,0.75); backdrop-filter: blur(16px); border-radius:20px; padding:28px 30px; box-shadow:0 30px 60px rgba(0,0,0,0.35); animation: floatY 7s ease-in-out 1.6s infinite; z-index:5; }
        @keyframes floatY{ 0%,100%{ transform:translateX(-50%) translateY(0); } 50%{ transform:translateX(-50%) translateY(-8px); } }
        .live-panel-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .live-tag{ font-family:${plex.style.fontFamily},monospace; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:var(--dark-muted); }
        .live-badge{ display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); border:1px solid var(--dark-border); padding:5px 10px; border-radius:999px; }
        .pulse-dot{ position:relative; width:7px; height:7px; }
        .pulse-dot::before{ content:''; position:absolute; inset:0; border-radius:50%; background:var(--positive-bright); opacity:0.6; animation:ping 1.6s ease infinite; }
        .pulse-dot::after{ content:''; position:absolute; inset:0; border-radius:50%; background:var(--positive-bright); }
        @keyframes ping{ 0%{ transform:scale(1); opacity:0.6; } 70%,100%{ transform:scale(2.4); opacity:0; } }
        .live-badge span{ font-size:10px; font-weight:700; letter-spacing:0.1em; color:var(--positive-bright); }
        .currency-strip{ display:flex; width:100%; height:8px; border-radius:999px; overflow:hidden; background:rgba(255,255,255,0.05); margin-bottom:24px; }
        .currency-strip span{ flex:1; }
        .rates-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        .rate-card{ border:1px solid var(--dark-border); background:rgba(255,255,255,0.04); border-radius:14px; padding:14px 16px; }
        .rate-pair{ font-family:${plex.style.fontFamily},monospace; font-size:10.5px; color:var(--dark-muted); letter-spacing:0.05em; }
        .rate-value{ display:flex; align-items:baseline; gap:7px; margin-top:5px; }
        .rate-value .v{ font-family:${plex.style.fontFamily},monospace; font-size:15.5px; transition: color .4s ease; }
        .rate-value .arrow{ font-family:${plex.style.fontFamily},monospace; font-size:10px; }
        .up{ color:var(--positive-bright); } .down{ color:#E5484D; }
        @media (max-width:700px){ .rates-grid{ grid-template-columns:repeat(2,1fr); } .hero h1{ font-size:38px; } .hero-photo-frame{ height:260px; } .hero-visual{ padding-bottom:0; } .live-panel{ position:static; transform:none; width:100%; margin-top:16px; } }

        .logo-strip{ background:var(--dark); border-top:1px solid var(--dark-border); padding:36px 0 48px; }
        .logo-strip p{ text-align:center; font-size:12px; color:var(--dark-muted); font-family:${plex.style.fontFamily},monospace; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:26px; }
        .logo-row{ display:flex; align-items:center; justify-content:center; gap:52px; flex-wrap:wrap; }
        .logo-row .wordmark{ font-family:${space.style.fontFamily},sans-serif; font-weight:600; font-size:17px; color:rgba(255,255,255,0.35); letter-spacing:-0.01em; transition: color .2s ease; }
        .logo-row .wordmark:hover{ color:rgba(255,255,255,0.75); }

        .stats-band{ background:var(--paper); border-bottom:1px solid var(--border); }
        .stats-inner{ max-width:1120px; margin:0 auto; padding:34px 24px; display:grid; grid-template-columns:repeat(4,1fr); gap:20px; text-align:center; }
        .stats-inner .num{ font-family:${space.style.fontFamily},sans-serif; font-weight:600; font-size:26px; }
        .stats-inner .lbl{ font-size:12px; color:var(--muted); margin-top:3px; font-family:${plex.style.fontFamily},monospace; letter-spacing:0.06em; text-transform:uppercase; }
        @media (max-width:700px){ .stats-inner{ grid-template-columns:repeat(2,1fr); } }

        .section{ padding:96px 0; }
        .section-head{ max-width:640px; margin-bottom:56px; }
        .section-eyebrow{ font-family:${plex.style.fontFamily},monospace; font-size:11px; letter-spacing:0.15em; text-transform:uppercase; color:var(--brand); margin-bottom:14px; font-weight:600; }
        .section-head h2{ font-family:${space.style.fontFamily},sans-serif; font-weight:600; font-size:38px; letter-spacing:-0.02em; line-height:1.15; }
        .section-head p{ font-size:15.5px; color:var(--muted); margin-top:14px; line-height:1.65; }
        .section-head.center{ margin-left:auto; margin-right:auto; text-align:center; }

        .bento{ display:grid; grid-template-columns:repeat(4,1fr); grid-auto-rows:170px; gap:16px; }
        .bento-tile{ background:var(--surface); border:1px solid var(--border); border-radius:22px; padding:26px; display:flex; flex-direction:column; justify-content:space-between; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; position:relative; overflow:hidden; }
        .bento-tile:hover{ transform:translateY(-3px); box-shadow:0 20px 40px rgba(24,20,15,0.08); border-color:var(--muted-2); }
        .bento-tile.large{ grid-column:span 2; grid-row:span 2; }
        .bento-tile.wide{ grid-column:span 2; }
        .tile-icon{ width:38px; height:38px; border-radius:11px; background:var(--brand-soft); display:flex; align-items:center; justify-content:center; }
        .tile-icon svg{ width:19px; height:19px; color:var(--brand); }
        .tile-icon.data{ background:var(--data-soft); } .tile-icon.data svg{ color:var(--data); }
        .tile-icon.positive{ background:#E7F5EC; } .tile-icon.positive svg{ color:var(--positive); }
        .bento-tile h3{ font-family:${space.style.fontFamily},sans-serif; font-size:16.5px; font-weight:600; margin-top:16px; letter-spacing:-0.01em; }
        .bento-tile p{ font-size:13px; color:var(--muted); line-height:1.55; margin-top:6px; }
        .mini-command{ margin-top:16px; background:var(--dark); border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:10px; border:1px solid var(--dark-border); }
        .mini-command svg{ width:14px; height:14px; color:var(--brand); flex-shrink:0; }
        .mini-command span{ font-size:12.5px; color:rgba(255,255,255,0.55); }
        .mini-command .cursor{ width:1px; height:13px; background:var(--brand); animation:blink 1s step-end infinite; }
        @keyframes blink{ 50%{ opacity:0; } }
        .route-diagram{ display:flex; align-items:center; gap:6px; margin-top:14px; }
        .route-diagram .node{ width:26px; height:26px; border-radius:8px; background:var(--data-soft); display:flex; align-items:center; justify-content:center; font-size:8.5px; font-family:${plex.style.fontFamily},monospace; font-weight:600; color:var(--data); flex-shrink:0; }
        .route-diagram .line{ flex:1; height:1px; background: repeating-linear-gradient(to right, var(--border) 0 4px, transparent 4px 8px); }
        @media (max-width:900px){ .bento{ grid-template-columns:repeat(2,1fr); grid-auto-rows:auto; } .bento-tile.large, .bento-tile.wide{ grid-column:span 2; } }
        @media (max-width:560px){ .bento{ grid-template-columns:1fr; } .bento-tile.large, .bento-tile.wide{ grid-column:span 1; } }

        .human-section{ background:var(--dark); color:#fff; padding:96px 0; }
        .quote-block{ max-width:760px; margin:0 auto 64px; text-align:center; }
        .quote-block .mark{ font-family:${space.style.fontFamily},sans-serif; font-size:52px; color:var(--brand); line-height:1; margin-bottom:10px; }
        .quote-block p{ font-family:${space.style.fontFamily},sans-serif; font-size:26px; font-weight:500; line-height:1.5; letter-spacing:-0.01em; }
        .quote-attrib{ display:flex; align-items:center; justify-content:center; gap:12px; margin-top:26px; }
        .avatar-photo{ width:44px; height:44px; border-radius:50%; object-fit:cover; flex-shrink:0; border:2px solid rgba(255,255,255,0.15); }
        .testimonial-card .avatar-photo{ width:34px; height:34px; border-color:rgba(255,255,255,0.1); }
        .quote-attrib .who{ text-align:left; }
        .quote-attrib .name{ font-size:13.5px; font-weight:600; }
        .quote-attrib .role{ font-size:12px; color:var(--dark-muted); }
        .testimonial-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        .testimonial-card{ background:rgba(255,255,255,0.04); border:1px solid var(--dark-border); border-radius:18px; padding:24px; }
        .testimonial-card .stat-pill{ display:inline-block; font-family:${plex.style.fontFamily},monospace; font-size:11px; color:var(--positive-bright); background:rgba(76,195,138,0.12); padding:4px 10px; border-radius:999px; margin-bottom:14px; }
        .testimonial-card p{ font-size:13.5px; line-height:1.65; color:rgba(255,255,255,0.82); }
        .testimonial-card .who{ display:flex; align-items:center; gap:10px; margin-top:18px; }
        .testimonial-card .name{ font-size:13px; font-weight:600; }
        .testimonial-card .role{ font-size:11.5px; color:var(--dark-muted); }
        @media (max-width:860px){ .testimonial-grid{ grid-template-columns:1fr; } .quote-block p{ font-size:21px; } }

        .tabs{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:36px; }
        .tab-btn{ font-size:13px; font-weight:600; padding:9px 16px; border-radius:999px; border:1px solid var(--border); background:var(--surface); color:var(--muted); cursor:pointer; transition: all .15s ease; }
        .tab-btn.active{ background:var(--ink); border-color:var(--ink); color:#fff; }
        .tab-panels{ position:relative; }
        .tab-panel{ display:none; }
        .tab-panel.active{ display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }
        .tab-panel h3{ font-family:${space.style.fontFamily},sans-serif; font-size:24px; font-weight:600; letter-spacing:-0.01em; }
        .tab-panel > div:first-child p{ font-size:14.5px; color:var(--muted); line-height:1.7; margin-top:12px; }
        .tab-panel ul{ list-style:none; margin-top:20px; display:flex; flex-direction:column; gap:11px; }
        .tab-panel li{ display:flex; align-items:flex-start; gap:10px; font-size:13.5px; color:var(--ink-soft); }
        .tab-panel li svg{ width:16px; height:16px; color:var(--positive); flex-shrink:0; margin-top:1px; }
        .tab-visual{ background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:28px; }
        .tab-visual .row{ display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border); font-size:13px; }
        .tab-visual .row:last-child{ border-bottom:none; }
        .tab-visual .row .l{ color:var(--muted); }
        .tab-visual .row .r{ font-family:${plex.style.fontFamily},monospace; font-weight:600; }
        @media (max-width:800px){ .tab-panel.active{ grid-template-columns:1fr; } }

        .coverage{ background:var(--surface); border:1px solid var(--border); border-radius:24px; padding:44px; margin-top:64px; position:relative; overflow:hidden; }
        .coverage-map{ width:100%; height:auto; }
        .coverage-map circle.hub{ animation: mapping 2.4s ease-in-out infinite; }
        @keyframes mapping{ 0%,100%{ opacity:0.5; } 50%{ opacity:1; } }

        .security-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:20px; }
        .security-card{ border:1px solid var(--border); background:var(--surface); border-radius:18px; padding:26px; }
        .security-card .tile-icon{ margin-bottom:16px; }
        .security-card h4{ font-family:${space.style.fontFamily},sans-serif; font-size:16px; font-weight:600; }
        .security-card p{ font-size:13px; color:var(--muted); line-height:1.6; margin-top:8px; }
        .badge-row{ display:flex; gap:8px; flex-wrap:wrap; margin-top:14px; }
        .cert-badge{ font-family:${plex.style.fontFamily},monospace; font-size:10.5px; font-weight:600; color:var(--ink-soft); border:1px solid var(--border); padding:4px 9px; border-radius:7px; background:var(--paper); }
        @media (max-width:860px){ .security-grid{ grid-template-columns:1fr; } }

        .cta{ position:relative; overflow:hidden; background:var(--dark); color:#fff; padding:110px 0; text-align:center; }
        .cta::before{ content:''; position:absolute; top:-30%; left:32%; width:520px; height:520px; background:var(--brand); opacity:0.16; border-radius:50%; filter:blur(130px); }
        .cta-inner{ position:relative; max-width:640px; margin:0 auto; padding:0 24px; }
        .cta h2{ font-family:${space.style.fontFamily},sans-serif; font-size:42px; font-weight:600; letter-spacing:-0.02em; }
        .cta p{ color:var(--dark-muted); margin-top:14px; font-size:15px; }
        .cta .btn-brand{ margin-top:32px; padding:14px 26px; font-size:14.5px; border-radius:12px; }

        footer{ background:var(--dark); color:#fff; border-top:1px solid var(--dark-border); padding:64px 0 32px; }
        .footer-grid{ display:grid; grid-template-columns:1.6fr repeat(4,1fr); gap:32px; }
        .footer-col h5{ font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:var(--dark-muted); margin-bottom:16px; }
        .footer-col a{ display:block; font-size:13.5px; color:rgba(255,255,255,0.75); margin-bottom:11px; transition:color .15s ease; }
        .footer-col a:hover{ color:#fff; }
        .footer-brand p{ font-size:13px; color:var(--dark-muted); margin-top:14px; max-width:220px; line-height:1.6; }
        .footer-bottom{ display:flex; align-items:center; justify-content:space-between; margin-top:56px; padding-top:24px; border-top:1px solid var(--dark-border); flex-wrap:wrap; gap:12px; }
        .footer-bottom p{ font-size:12px; color:var(--dark-muted); }
        @media (max-width:860px){ .footer-grid{ grid-template-columns:1fr 1fr; } }
      `}</style>

      <header className="nav">
        <div className="nav-inner">
          <div className="brand">
            <div className="brand-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            </div>
            <span className="brand-name">Wireways</span>
          </div>
          <nav className="nav-links">
            <a className="nav-item" href="#product">Product</a>
            <a className="nav-item" href="#customers">Customers</a>
            <a className="nav-item" href="#coverage">Coverage</a>
            <a className="nav-item" href="#security">Security</a>
          </nav>
          <div className="nav-cta">
            <Link className="btn-ghost" href="/login">Sign in</Link>
            <Link className="btn-brand" href="/register">Create workspace <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="grid-overlay"></div>
        <div className="hero-inner">
          <p className="eyebrow">Wireways · Financial Operating System</p>
          <h1>
            <span className="word" style={{ animationDelay: "0.05s" }}>Every</span>
            <span className="word" style={{ animationDelay: "0.12s" }}>currency.</span>
            <span className="word" style={{ animationDelay: "0.19s" }}>One</span>
            <span className="word accent" style={{ animationDelay: "0.26s" }}>intelligent</span>
            <span className="word" style={{ animationDelay: "0.33s" }}>ledger.</span>
          </h1>
          <p className="hero-sub">Hold, convert, and route funds across 190+ countries — with an AI copilot that plans, executes, and never sleeps. Built for the operators who used to do this by hand.</p>
          <div className="hero-cta">
            <Link className="btn-brand" href="/register">Create your workspace <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></Link>
            <Link className="btn-outline" href="/login">Sign in</Link>
          </div>
          <div className="trust-row">
            <div className="stars">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span><b>4.9/5</b> from 2,400+ businesses</span>
            </div>
            <div className="trust-divider"></div>
            <div className="stat"><b>190+</b> countries reached</div>
            <div className="trust-divider"></div>
            <div className="stat">SOC 2 Type II · PCI DSS Level 1</div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-photo-frame">
            <img src="https://images.unsplash.com/photo-1758691737568-a1572060ce5a?auto=format&fit=crop&w=1600&q=80" alt="A Wireways customer team reviewing payments together in their office" />
          </div>
          <div className="live-panel">
            <div className="live-panel-head">
              <span className="live-tag">Network liquidity · live</span>
              <div className="live-badge"><span className="pulse-dot"></span><span>LIVE</span></div>
            </div>
            <div className="currency-strip">
              <span style={{ background: "#F1622C" }}></span>
              <span style={{ background: "#4C5C88" }}></span>
              <span style={{ background: "#8791B3" }}></span>
              <span style={{ background: "#17824A" }}></span>
              <span style={{ background: "#B3AC9F" }}></span>
            </div>
            <div className="rates-grid">
              {rates.map((r, i) => (
                <div className="rate-card" key={i}>
                  <div className="rate-pair">{r.pair}</div>
                  <div className="rate-value">
                    <span className={`v ${r.up ? "up" : "down"}`}>{r.value.toFixed(r.decimals)}</span>
                    <span className={`arrow ${r.up ? "up" : "down"}`}>{r.up ? "▲" : "▼"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="logo-strip">
        <p>Powering finance teams at</p>
        <div className="logo-row">
          <span className="wordmark">Northwind</span>
          <span className="wordmark">Halcyon Labs</span>
          <span className="wordmark">Meridian Goods</span>
          <span className="wordmark">Solace Studio</span>
          <span className="wordmark">Kaia &amp; Co</span>
          <span className="wordmark">Fernbridge</span>
        </div>
      </section>

      <section className="stats-band">
        <div className="stats-inner">
          <div><div className="num">190+</div><div className="lbl">Countries</div></div>
          <div><div className="num">45</div><div className="lbl">Currencies</div></div>
          <div><div className="num">14</div><div className="lbl">Routing rails</div></div>
          <div><div className="num">24/7</div><div className="lbl">AI monitoring</div></div>
        </div>
      </section>

      <section className="section" id="product">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="section-eyebrow">Product</p>
            <h2>One ledger. Every way you move money.</h2>
            <p>Wireways isn't a payments dashboard with a chatbot bolted on — the AI sits underneath everything, from routing decisions to compliance checks.</p>
          </div>
          <div className="bento">
            <div className="bento-tile large reveal">
              <div>
                <div className="tile-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z"/><path d="M8 14a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4"/><path d="M12 11v3"/></svg></div>
                <h3>Conversational command</h3>
                <p>Tell Wireways what you want in plain language. It drafts the payment, you approve, it executes — idempotently, every time.</p>
              </div>
              <div className="mini-command">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.6L19 9l-5.4 1.4L12 16l-1.6-5.6L5 9l5.4-1.4L12 2z"/></svg>
                <span>Send $18,200 to Acme Corp via ACH</span>
                <span className="cursor"></span>
              </div>
            </div>
            <div className="bento-tile reveal">
              <div className="tile-icon data"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></svg></div>
              <div><h3>Global accounts</h3><p>Local account details in 45 currencies, held under your own workspace.</p></div>
            </div>
            <div className="bento-tile reveal">
              <div className="tile-icon positive"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/></svg></div>
              <div><h3>Cards</h3><p>Issue virtual and physical cards with AI-set spend controls.</p></div>
            </div>
            <div className="bento-tile wide reveal">
              <div>
                <div className="tile-icon data"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10h13l-4-4M17 14H4l4 4"/></svg></div>
                <h3>Neural routing engine</h3>
                <p>Every payout is scored across MPesa, SEPA, SWIFT and crypto rails for speed and cost, in real time.</p>
              </div>
              <div className="route-diagram">
                <div className="node">SRC</div><div className="line"></div><div className="node">FX</div><div className="line"></div><div className="node">SEPA</div><div className="line"></div><div className="node">DST</div>
              </div>
            </div>
            <div className="bento-tile reveal">
              <div className="tile-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg></div>
              <div><h3>Bank-grade isolation</h3><p>Multi-tenant ledgers and signed sessions. Your money lives in its own universe.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="human-section" id="customers">
        <div className="wrap">
          <div className="quote-block reveal">
            <div className="mark">"</div>
            <p>We didn't want another dashboard that made us feel like an accountant. We wanted something that felt like it had a finance team of its own, running quietly in the background.</p>
            <div className="quote-attrib">
              <img className="avatar-photo" src="https://images.unsplash.com/photo-1758518727888-ffa196002e59?auto=format&fit=crop&w=200&q=80" alt="Amara N." />
              <div className="who">
                <div className="name">Amara N.</div>
                <div className="role">Head of Finance, Northwind Logistics</div>
              </div>
            </div>
          </div>
          <div className="testimonial-grid">
            <div className="testimonial-card reveal">
              <span className="stat-pill">3 days → same-day</span>
              <p>"Our supplier payouts used to take three days of back-and-forth with the bank. Now I just tell Wireways who to pay and it finds the fastest rail."</p>
              <div className="who">
                <img className="avatar-photo" src="https://images.unsplash.com/photo-1758518729058-b158e71c5a9b?auto=format&fit=crop&w=200&q=80" alt="Tomás K." />
                <div><div className="name">Tomás K.</div><div className="role">Ops Lead, Fernbridge</div></div>
              </div>
            </div>
            <div className="testimonial-card reveal">
              <span className="stat-pill">4 currencies, 1 view</span>
              <p>"We hold USD, EUR, GBP and USDC and used to reconcile them in four different tabs. Wireways just shows me one number I trust."</p>
              <div className="who">
                <img className="avatar-photo" src="https://images.unsplash.com/photo-1758691737605-69a0e78bd193?auto=format&fit=crop&w=200&q=80" alt="Riya M." />
                <div><div className="name">Riya M.</div><div className="role">Founder, Solace Studio</div></div>
              </div>
            </div>
            <div className="testimonial-card reveal">
              <span className="stat-pill">Zero missed payroll</span>
              <p>"The AI flags anything unusual before it happens, not after. That alone paid for itself in the first month."</p>
              <div className="who">
                <img className="avatar-photo" src="https://images.unsplash.com/photo-1758691737646-79dbce8e25fb?auto=format&fit=crop&w=200&q=80" alt="Jide O." />
                <div><div className="name">Jide O.</div><div className="role">CFO, Meridian Goods</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="coverage">
        <div className="wrap">
          <div className="section-head reveal">
            <p className="section-eyebrow">Built for how you actually work</p>
            <h2>One platform, every kind of business.</h2>
          </div>
          <div className="tabs reveal">
            <button className={`tab-btn ${activeTab === "marketplaces" ? "active" : ""}`} onClick={() => setActiveTab("marketplaces")}>Marketplaces</button>
            <button className={`tab-btn ${activeTab === "saas" ? "active" : ""}`} onClick={() => setActiveTab("saas")}>SaaS &amp; Subscriptions</button>
            <button className={`tab-btn ${activeTab === "agencies" ? "active" : ""}`} onClick={() => setActiveTab("agencies")}>Agencies &amp; Freelancers</button>
            <button className={`tab-btn ${activeTab === "payroll" ? "active" : ""}`} onClick={() => setActiveTab("payroll")}>Global Payroll</button>
          </div>
          <div className="tab-panels reveal">
            <div className={`tab-panel ${activeTab === "marketplaces" ? "active" : ""}`}>
              <div>
                <h3>Split and settle payouts automatically</h3>
                <p>Collect from buyers in their local currency and split payouts to thousands of sellers without manual reconciliation.</p>
                <ul>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Automatic seller payout splitting</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Multi-currency settlement in one ledger</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>AI-flagged disputes before payout</li>
                </ul>
              </div>
              <div className="tab-visual">
                <div className="row"><span className="l">Buyer payment</span><span className="r">+$4,200.00</span></div>
                <div className="row"><span className="l">Seller payout (auto-split)</span><span className="r">-$3,780.00</span></div>
                <div className="row"><span className="l">Platform fee</span><span className="r">$420.00</span></div>
                <div className="row"><span className="l">Settlement time</span><span className="r">~ 4 min</span></div>
              </div>
            </div>
            <div className={`tab-panel ${activeTab === "saas" ? "active" : ""}`}>
              <div>
                <h3>Bill globally, reconcile instantly</h3>
                <p>Accept subscriptions in 45 currencies while your books stay in one — no manual FX reconciliation at month end.</p>
                <ul>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Recurring billing across currencies</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Failed payment recovery, handled by AI</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Single reporting currency for finance</li>
                </ul>
              </div>
              <div className="tab-visual">
                <div className="row"><span className="l">MRR (converted)</span><span className="r">$182,400.00</span></div>
                <div className="row"><span className="l">Failed charges recovered</span><span className="r">94%</span></div>
                <div className="row"><span className="l">Currencies billed in</span><span className="r">18</span></div>
                <div className="row"><span className="l">Reporting currency</span><span className="r">USD</span></div>
              </div>
            </div>
            <div className={`tab-panel ${activeTab === "agencies" ? "active" : ""}`}>
              <div>
                <h3>Pay contractors anywhere, same day</h3>
                <p>Route contractor and vendor payouts through whichever rail is fastest and cheapest for their country — automatically.</p>
                <ul>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Bulk contractor payouts</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Automatic lowest-cost rail selection</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>One invoice, many currencies paid out</li>
                </ul>
              </div>
              <div className="tab-visual">
                <div className="row"><span className="l">Contractors paid this run</span><span className="r">142</span></div>
                <div className="row"><span className="l">Avg. payout time</span><span className="r">6 hrs</span></div>
                <div className="row"><span className="l">Rails used</span><span className="r">SWIFT, SEPA, MPesa</span></div>
                <div className="row"><span className="l">Total routed</span><span className="r">$96,340.00</span></div>
              </div>
            </div>
            <div className={`tab-panel ${activeTab === "payroll" ? "active" : ""}`}>
              <div>
                <h3>Run payroll like clockwork</h3>
                <p>Wireways watches your payroll calendar and flags funding gaps before payday, not after.</p>
                <ul>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Funding-gap alerts ahead of payday</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Multi-country payroll in one run</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Zero missed pay cycles, on record</li>
                </ul>
              </div>
              <div className="tab-visual">
                <div className="row"><span className="l">Next payroll run</span><span className="r">Aug 30</span></div>
                <div className="row"><span className="l">Headcount covered</span><span className="r">63</span></div>
                <div className="row"><span className="l">Countries in this run</span><span className="r">7</span></div>
                <div className="row"><span className="l">Funding status</span><span className="r">On track</span></div>
              </div>
            </div>
          </div>
          <div className="coverage reveal">
            <svg className="coverage-map" viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.5">
                <circle cx="60" cy="90" r="1.5" fill="#B3AC9F"/><circle cx="90" cy="110" r="1.5" fill="#B3AC9F"/><circle cx="120" cy="80" r="1.5" fill="#B3AC9F"/>
                <circle cx="220" cy="60" r="1.5" fill="#B3AC9F"/><circle cx="260" cy="90" r="1.5" fill="#B3AC9F"/><circle cx="300" cy="70" r="1.5" fill="#B3AC9F"/>
                <circle cx="420" cy="120" r="1.5" fill="#B3AC9F"/><circle cx="460" cy="150" r="1.5" fill="#B3AC9F"/><circle cx="440" cy="190" r="1.5" fill="#B3AC9F"/>
                <circle cx="600" cy="90" r="1.5" fill="#B3AC9F"/><circle cx="640" cy="130" r="1.5" fill="#B3AC9F"/><circle cx="680" cy="100" r="1.5" fill="#B3AC9F"/>
                <circle cx="760" cy="150" r="1.5" fill="#B3AC9F"/><circle cx="800" cy="180" r="1.5" fill="#B3AC9F"/><circle cx="820" cy="130" r="1.5" fill="#B3AC9F"/>
              </g>
              <line x1="100" y1="95" x2="450" y2="140" stroke="#EAE6DF" strokeWidth="1" strokeDasharray="2 4"/>
              <line x1="450" y1="140" x2="640" y2="110" stroke="#EAE6DF" strokeWidth="1" strokeDasharray="2 4"/>
              <line x1="450" y1="140" x2="250" y2="75" stroke="#EAE6DF" strokeWidth="1" strokeDasharray="2 4"/>
              <line x1="640" y1="110" x2="800" y2="150" stroke="#EAE6DF" strokeWidth="1" strokeDasharray="2 4"/>
              <circle className="hub" cx="100" cy="95" r="5" fill="#F1622C"/>
              <circle className="hub" cx="450" cy="140" r="5" fill="#F1622C" style={{ animationDelay: "0.4s" }}/>
              <circle className="hub" cx="250" cy="75" r="5" fill="#4C5C88" style={{ animationDelay: "0.8s" }}/>
              <circle className="hub" cx="640" cy="110" r="5" fill="#4C5C88" style={{ animationDelay: "1.2s" }}/>
              <circle className="hub" cx="800" cy="150" r="5" fill="#17824A" style={{ animationDelay: "1.6s" }}/>
            </svg>
          </div>
        </div>
      </section>

      <section className="section" id="security" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="wrap">
          <div className="section-head reveal">
            <p className="section-eyebrow">Trust &amp; infrastructure</p>
            <h2>Infrastructure you can build a business on.</h2>
            <p>Payments software fails quietly until it doesn't. Wireways is engineered so it never gets the chance to.</p>
          </div>
          <div className="security-grid">
            <div className="security-card reveal">
              <div className="tile-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg></div>
              <h4>Bank-grade isolation</h4>
              <p>Every workspace runs on its own multi-tenant ledger with bcrypt-hashed credentials and signed sessions.</p>
              <div className="badge-row"><span className="cert-badge">SOC 2 TYPE II</span><span className="cert-badge">PCI DSS L1</span><span className="cert-badge">ISO 27001</span></div>
            </div>
            <div className="security-card reveal">
              <div className="tile-icon data"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg></div>
              <h4>Real-time reconciliation</h4>
              <p>Every ledger entry is reconciled the moment it lands — not at end of day, not at month end.</p>
              <div className="badge-row"><span className="cert-badge">99.99% UPTIME</span><span className="cert-badge">SUB-SECOND LEDGER</span></div>
            </div>
            <div className="security-card reveal">
              <div className="tile-icon positive"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
              <h4>AI monitoring, always on</h4>
              <p>Anomalies in spend, routing, or compliance are flagged before execution, not discovered afterward.</p>
              <div className="badge-row"><span className="cert-badge">24/7 MONITORING</span><span className="cert-badge">PRE-EXECUTION CHECKS</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-inner">
          <h2 className="reveal">Start moving money in minutes.</h2>
          <p className="reveal">Free to start. Your workspace is ready the moment you sign up.</p>
          <Link className="btn-brand reveal" href="/register">Create your workspace <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></Link>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="brand">
                <div className="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div>
                <span className="brand-name">Wireways</span>
              </div>
              <p>Money, with intelligence. One ledger for every currency, rail, and workflow.</p>
            </div>
            <div className="footer-col">
              <h5>Product</h5>
              <Link href="/login">AI Command</Link><Link href="/login">Wallets</Link><Link href="/login">Cards</Link><Link href="/login">Payment Links</Link>
            </div>
            <div className="footer-col">
              <h5>Company</h5>
              <a href="#">About</a><a href="#">Careers</a><a href="#">Blog</a><a href="#">Press</a>
            </div>
            <div className="footer-col">
              <h5>Resources</h5>
              <a href="#">Docs</a><a href="#">API reference</a><a href="#">Status</a><a href="#">Guides</a>
            </div>
            <div className="footer-col">
              <h5>Legal</h5>
              <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Compliance</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Wireways. Money, with intelligence.</p>
            <p>190+ countries · 45 currencies · SOC 2 Type II</p>
          </div>
        </div>
      </footer>
    </>
  );
}