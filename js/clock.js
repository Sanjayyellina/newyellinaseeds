// ============================================================
// LIVE CLOCK
"use strict";
// Yellina Seeds Private Limited — Operations Platform
// ============================================================

// ================================================================
// CLOCK
// ================================================================
setInterval(()=>{
  const el = document.getElementById('clock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour12: false });
}, 1000);
