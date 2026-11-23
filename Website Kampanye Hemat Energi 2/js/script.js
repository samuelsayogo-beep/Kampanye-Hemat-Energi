// ==========================================
// KAMPANYE HEMAT ENERGI - SCRIPT UTAMA
// Mendukung Visualisasi Data (Fase 2) dan Ajakan Bertindak 1 (Fase 3)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initDataPage();
  initAksiPage();
});

// ------------------------------------------
// FASE 2: INISIALISASI HALAMAN DATA & FAKTA
// ------------------------------------------
function initDataPage() {
  const chartIndikatorCanvas = document.getElementById('chartIndikator');
  if (!chartIndikatorCanvas) return; // Bukan halaman data.html

  // Metode pemuatan data ganda: Cek DATA_ENERGI global dulu (fallback offline), lalu fetch JSON
  if (typeof DATA_ENERGI !== 'undefined' && DATA_ENERGI) {
    renderAllCharts(DATA_ENERGI);
  } else {
    fetch('data/data-perilaku-energi.json')
      .then(res => {
        if (!res.ok) throw new Error('Gagal mengambil file JSON');
        return res.json();
      })
      .then(data => renderAllCharts(data))
      .catch(err => {
        console.warn('Gagal fetch data-perilaku-energi.json, mencoba data/data.json:', err);
        return fetch('data/data.json')
          .then(r => r.json())
          .then(data => renderAllCharts(data))
          .catch(e => console.error('Semua sumber data gagal dimuat:', e));
      });
  }
}

function renderAllCharts(data) {
  // Update Kartu Statistik Ringkasan jika elemen ada
  updateStatCards(data);

  // 1. Grafik Skor 10 Butir Indikator (P01 - P10)
  renderChartIndikator(data.per_butir);

  // 2. Grafik Distribusi Kategori Skor
  renderChartKategori(data.ringkasan.kategori_persen);

  // 3. Grafik Perbandingan Antar Jurusan
  renderChartJurusan(data.per_jurusan);

  // 4. Grafik Perbandingan Antar Rayon
  renderChartRayon(data.per_rayon);
}

function updateStatCards(data) {
  const elResponden = document.getElementById('statResponden');
  const elRataRata = document.getElementById('statRataRata');
  const elPersenSering = document.getElementById('statPersenSering');
  const elKategoriMayoritas = document.getElementById('statKategoriMayoritas');

  if (elResponden) elResponden.textContent = `${data.meta.jumlah_responden} Siswa`;
  if (elRataRata) elRataRata.textContent = `${data.ringkasan.rata_rata_skor} / 4.00`;
  if (elPersenSering) elPersenSering.textContent = `${data.ringkasan.persen_sering_rata_rata}%`;
  if (elKategoriMayoritas) elKategoriMayoritas.textContent = `${data.ringkasan.kategori_persen["Sangat Baik"]}% Sangat Baik`;
}

// Grafik 1: 10 Indikator Perilaku
function renderChartIndikator(items) {
  const ctx = document.getElementById('chartIndikator');
  if (!ctx) return;

  const labels = items.map(item => `${item.kode}: ${item.label}`);
  const scores = items.map(item => item.rata_rata);

  // Berikan warna khusus: P04 & P09 (terendah) diberi warna aksen oranye, lainnya hijau
  const bgColors = items.map(item => {
    if (item.kode === 'P04' || item.kode === 'P09') return '#e67e22'; // Skor terendah (3.22)
    if (item.kode === 'P05') return '#f39c12'; // P05 (3.30)
    return '#2f7d32'; // Positif / Tinggi
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Rata-Rata Skor (Skala 1-4)',
        data: scores,
        backgroundColor: bgColors,
        borderRadius: 6,
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y', // Bar horizontal agar terbaca jelas
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const item = items[context.dataIndex];
              return ` Skor: ${context.raw} | Sering: ${item.persen_sering}% | Jarang: ${item.persen_jarang}%`;
            }
          }
        }
      },
      scales: {
        x: {
          min: 2.8,
          max: 4.0,
          title: { display: true, text: 'Rata-Rata Skor Likert (Maksimal 4.00)', color: '#24352a', font: { weight: 'bold' } }
        },
        y: {
          ticks: { font: { size: 12 } }
        }
      }
    }
  });
}

// Grafik 2: Distribusi Kategori Perilaku
function renderChartKategori(kategoriPersen) {
  const ctx = document.getElementById('chartKategori');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Sangat Baik (59.4%)', 'Baik (36.8%)', 'Cukup (3.6%)', 'Kurang (0.2%)'],
      datasets: [{
        data: [
          kategoriPersen["Sangat Baik"],
          kategoriPersen["Baik"],
          kategoriPersen["Cukup"],
          kategoriPersen["Kurang"]
        ],
        backgroundColor: ['#2f7d32', '#66bb6a', '#f39c12', '#e74c3c'],
        borderWidth: 2,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 14, padding: 12 }
        }
      }
    }
  });
}

// Grafik 3: Rata-rata Skor per Jurusan
function renderChartJurusan(jurusanList) {
  const ctx = document.getElementById('chartJurusan');
  if (!ctx) return;

  const labels = jurusanList.map(j => j.kode);
  const scores = jurusanList.map(j => j.rata_rata_skor);
  const bgColors = jurusanList.map(j => {
    if (j.kode === 'PPLG' || j.kode === 'MPLB') return '#e67e22'; // Skor terendah
    if (j.kode === 'PMN') return '#1b5e20'; // Tertinggi
    return '#2f7d32';
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Rata-Rata Skor',
        data: scores,
        backgroundColor: bgColors,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function(items) {
              const j = jurusanList[items[0].dataIndex];
              return `${j.kode} - ${j.nama}`;
            },
            label: function(context) {
              return ` Skor: ${context.raw} (${jurusanList[context.dataIndex].jumlah_responden} siswa)`;
            }
          }
        }
      },
      scales: {
        y: {
          min: 3.0,
          max: 3.7,
          title: { display: true, text: 'Rata-Rata Skor', font: { weight: 'bold' } }
        }
      }
    }
  });
}

// Grafik 4: Rata-rata Skor per Rayon
function renderChartRayon(rayonList) {
  const ctx = document.getElementById('chartRayon');
  if (!ctx) return;

  const labels = rayonList.map(r => r.rayon);
  const scores = rayonList.map(r => r.rata_rata_skor);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Rata-Rata Skor',
        data: scores,
        backgroundColor: '#43a047',
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          min: 3.1,
          max: 3.6,
          title: { display: true, text: 'Rata-Rata Skor', font: { weight: 'bold' } }
        }
      }
    }
  });
}

// ------------------------------------------
// FASE 3: INISIALISASI AJAKAN BERTINDAK 1
// ------------------------------------------
function initAksiPage() {
  initChallengeTracker();
}

// Fitur Tantangan Hemat Energi 7 Hari (Tersimpan di localStorage)
function initChallengeTracker() {
  const checkboxes = document.querySelectorAll('.challenge-checkbox');
  if (checkboxes.length === 0) return;

  const STORAGE_KEY = 'energi_challenge_progress';
  const savedProgress = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  checkboxes.forEach((cb, idx) => {
    const dayKey = `day_${idx + 1}`;
    if (savedProgress[dayKey]) {
      cb.checked = true;
      cb.closest('.challenge-card')?.classList.add('completed');
    }

    cb.addEventListener('change', () => {
      savedProgress[dayKey] = cb.checked;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProgress));
      if (cb.checked) {
        cb.closest('.challenge-card')?.classList.add('completed');
      } else {
        cb.closest('.challenge-card')?.classList.remove('completed');
      }
      updateProgressDisplay(checkboxes);
    });
  });

  updateProgressDisplay(checkboxes);

  const resetBtn = document.getElementById('resetChallengeBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Apakah kamu yakin ingin mengulang tantangan 7 hari dari awal?')) {
        localStorage.removeItem(STORAGE_KEY);
        checkboxes.forEach(cb => {
          cb.checked = false;
          cb.closest('.challenge-card')?.classList.remove('completed');
        });
        updateProgressDisplay(checkboxes);
      }
    });
  }
}

function updateProgressDisplay(checkboxes) {
  const total = checkboxes.length;
  let checkedCount = 0;
  checkboxes.forEach(cb => { if (cb.checked) checkedCount++; });

  const percent = Math.round((checkedCount / total) * 100);
  const progressBar = document.getElementById('challengeProgressBar');
  const progressText = document.getElementById('challengeProgressText');
  const badgeCongrats = document.getElementById('challengeCongrats');

  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressText) progressText.textContent = `${checkedCount} dari ${total} Selesai (${percent}%)`;

  if (badgeCongrats) {
    if (checkedCount === total) {
      badgeCongrats.style.display = 'block';
    } else {
      badgeCongrats.style.display = 'none';
    }
  }
}
