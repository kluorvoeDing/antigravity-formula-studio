// 在畫面繪製前套用使用者選過的深淺色，避免閃一下。沒有選過就跟隨系統（交給 CSS 的媒體查詢）。
try {
  const theme = localStorage.getItem("ag_theme");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
} catch {}
